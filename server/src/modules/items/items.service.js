import ItemRepository from "./items.repository.js";
import AppError from "../../core/errors/AppError.js";
import NodeCache from "node-cache";
import { enrichWithAging, computeAgingSummary } from "./items.aging.js";
import { buildSearchQuery, buildSortOptions, STATUS_GROUPS } from "./items.query-builder.js";
import { broadcast } from "./items.events.js";
import { ALLOWED_STATUSES } from "../../constants/status.js";
import StatsService from "../stats/stats.service.js";

const statsCache = new NodeCache({ stdTTL: 300 });

class ItemService {
    async getItems({ page, limit, search, statusGroup, userRole, includeMetadata, sortBy, sortOrder, technicianName }) {
        const skip = (page - 1) * limit;
        const query = buildSearchQuery({ search, statusGroup, technicianName });
        const sortObject = buildSortOptions({ sortBy, sortOrder });
        const showMetadata = userRole === "admin" && includeMetadata === "true";

        // ── Stat counts (cached per technician) ────────────────────────
        // _getStatCounts() uses a single $facet aggregation — 1 DB round-trip
        // instead of 3 parallel countDocuments calls.
        const { inProgress, ready, returned } = await this._getStatCounts(technicianName);

        // ── Total is free — derived from stat counts ───────────────────
        // Every non-deleted item belongs to exactly one STATUS_GROUP (enforced
        // by the dev-time completeness check in items.query-builder.js), so the
        // sum is always correct. Eliminates the previous countDocuments({ isDeleted: false })
        // round-trip that ran in parallel with findAll on every request.
        const total = inProgress + ready + returned;

        // ── Fetch current page of items ────────────────────────────────
        const items = await ItemRepository.findAll({ query, skip, limit, showMetadata, sort: sortObject });

        // ── Enrich items with aging info (in-place, O(pageSize)) ───────
        const now = Date.now();
        for (const item of items) {
            enrichWithAging(item, now);
        }

        // ── Filtered total for pagination ──────────────────────────────
        // When unfiltered, the total from stat counts is exact — no extra query.
        // When filtered, we need the count of documents matching the specific query.
        const isFiltered = search || statusGroup || (technicianName && technicianName !== "All");
        const filteredTotal = isFiltered
            ? await ItemRepository.countDocuments(query)
            : total;

        // ── Aging summary (cached per technician — runs once every 5 min)
        const agingCacheKey = `agingSummary:${technicianName || "All"}`;
        let agingSummary = statsCache.get(agingCacheKey);
        if (!agingSummary) {
            agingSummary = await computeAgingSummary(technicianName);
            statsCache.set(agingCacheKey, agingSummary);
        }

        return {
            items,
            currentPage: page,
            totalPages: Math.ceil(filteredTotal / limit),
            totalItems: filteredTotal,
            stats: {
                total:        total        || 0,
                inProgress:   inProgress   || 0,
                ready:        ready        || 0,
                returned:     returned     || 0,
                agingSummary,
            },
        };
    }

    async createItem(data, user) {
        const existing = await ItemRepository.findByJobNumber(data.jobNumber);
        if (existing) {
            throw new AppError("Job number already exists", 400);
        }

        const initialStatus = data.status || "Received";
        const itemData = {
            ...data,
            status: initialStatus,
            technicianName: user.displayName,
            statusHistory: [{
                status:    initialStatus,
                note:      data.repairNotes ? String(data.repairNotes).trim() : "Job Created",
                changedAt: new Date(),
            }],
        };

        // Invalidate AFTER confirmed write — not before.
        // If create throws (duplicate race condition, network blip), the cache
        // should not have been cleared since the data has not changed.
        const newItem = await ItemRepository.create(itemData);
        this._invalidateCache();
        broadcast("job:created", { jobNumber: newItem.jobNumber });
        return newItem;
    }

    async updateItem(id, data) {
        const item = await ItemRepository.findById(id);
        if (!item) {
            throw new AppError("Item not found", 404);
        }

        if (data.customerName)               item.customerName    = String(data.customerName).trim();
        if (data.brand)                      item.brand           = String(data.brand).trim();
        if (data.phoneNumber)                item.phoneNumber     = String(data.phoneNumber).trim();
        if (data.repairNotes !== undefined)   item.repairNotes    = String(data.repairNotes).trim();
        if (data.issue !== undefined)         item.issue          = String(data.issue).trim();
        if (data.finalCost !== undefined)     item.finalCost      = Number(data.finalCost) || 0;
        if (data.technicianName !== undefined) item.technicianName = String(data.technicianName).trim();
        if (data.dueDate !== undefined)       item.dueDate        = data.dueDate ? new Date(data.dueDate) : null;

        if (data.status && data.status !== item.status) {
            // ALLOWED_STATUSES check is already done in items.validator.js before this
            // method is ever called. The check is kept here as a service-layer guard
            // for any future caller that bypasses the validator (e.g. internal scripts,
            // tests calling the service directly). If you remove the validator route,
            // remove this comment too.
            if (!ALLOWED_STATUSES.includes(data.status)) {
                throw new AppError(`Invalid status: "${data.status}". Must be one of: ${ALLOWED_STATUSES.join(", ")}`, 400);
            }

            if (data.status === "Delivered" && !item.finalCost) {
                throw new AppError("A final amount must be provided before marking the job as Delivered.", 400);
            }

            item.status = data.status;
            item.statusHistory.push({
                status:    data.status,
                note:      data.repairNotes ? String(data.repairNotes).trim() : "",
                changedAt: new Date(),
            });

            if (data.status === "Ready") {
                if (!item.dueDate) item.dueDate = new Date();
                if (!item.revenueRealizedAt) {
                    item.revenueRealizedAt = new Date();
                    // Pass the date so stats cache only evicts ranges that
                    // overlap this job's revenueRealizedAt — not the entire cache.
                    StatsService.invalidateRevenueCache(item.revenueRealizedAt);
                }
            } else if (data.status === "Delivered") {
                if (!item.revenueRealizedAt) {
                    item.revenueRealizedAt = new Date();
                    StatsService.invalidateRevenueCache(item.revenueRealizedAt);
                }
                item.deliveredAt = new Date();
            }
        }

        const savedItem = await item.save();

        if (data.status) {
            this._invalidateCache();
        }

        broadcast("job:updated", { id });
        return savedItem;
    }

    async deleteItem(id) {
        const item = await ItemRepository.findById(id);
        if (!item) {
            throw new AppError("Item not found", 404);
        }

        // Invalidate AFTER confirmed soft-delete — same reason as createItem.
        const deleted = await ItemRepository.softDelete(id);
        this._invalidateCache();
        broadcast("job:deleted", { id });
        return deleted;
    }

    async bulkDeleteItems(ids) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new AppError("ids must be a non-empty array", 400);
        }

        const result = await ItemRepository.bulkSoftDelete(ids);
        this._invalidateCache();
        broadcast("job:bulk-updated", { count: ids.length, isDelete: true });
        return result;
    }

    async bulkUpdateStatus(ids, newStatus) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new AppError("ids must be a non-empty array", 400);
        }

        if (!newStatus || !ALLOWED_STATUSES.includes(newStatus)) {
            throw new AppError(`Invalid status: "${newStatus}". Must be one of: ${ALLOWED_STATUSES.join(", ")}`, 400);
        }

        if (newStatus === "Delivered") {
            throw new AppError('Cannot bulk update to "Delivered". Please update items individually to provide the final amount.', 400);
        }

        const result = await ItemRepository.bulkUpdateStatus(ids, newStatus);

        if (newStatus === "Ready") {
            // Both operations target different fields on the same documents — run in parallel.
            await Promise.all([
                ItemRepository.bulkSetRevenueRealized(ids),
                ItemRepository.bulkSetDueDateIfNull(ids),
            ]);
            // Bulk Ready sets revenueRealizedAt to now — pass today's date for
            // targeted cache invalidation instead of flushing everything.
            StatsService.invalidateRevenueCache(new Date());
        }

        this._invalidateCache();
        broadcast("job:bulk-updated", { count: ids.length, status: newStatus });
        return result;
    }

    async trackItem(jobNumber, phoneNumber) {
        return await ItemRepository.findByTrackingDetails(jobNumber, phoneNumber);
    }

    async getBackup() {
        return await ItemRepository.findAllForBackup();
    }

    // ── Private helpers ────────────────────────────────────────────────

    async _getStatCounts(technicianName = "All") {
        const cacheKey = `itemStats:${technicianName || "All"}`;
        const cached = statsCache.get(cacheKey);
        if (cached) return cached;

        const matchStage = { isDeleted: false };
        if (technicianName && technicianName !== "All") {
            const baseName = technicianName.replace(/\s*\(Admin\)\s*$/i, "");
            if (baseName !== technicianName) {
                matchStage.technicianName = { $in: [technicianName, baseName] };
            } else {
                matchStage.technicianName = technicianName;
            }
        }

        const [result] = await ItemRepository.aggregate([
            { $match: matchStage },
            {
                $facet: {
                    inProgress: [{ $match: { status: { $in: STATUS_GROUPS.inProgress } } }, { $count: "n" }],
                    ready:      [{ $match: { status: { $in: STATUS_GROUPS.ready      } } }, { $count: "n" }],
                    returned:   [{ $match: { status: { $in: STATUS_GROUPS.returned   } } }, { $count: "n" }],
                },
            },
        ]);

        const stats = {
            inProgress: result?.inProgress?.[0]?.n ?? 0,
            ready:      result?.ready?.[0]?.n      ?? 0,
            returned:   result?.returned?.[0]?.n   ?? 0,
        };

        statsCache.set(cacheKey, stats);
        return stats;
    }

    _invalidateCache() {
        // flushAll is safer here because different technicians have different cache keys
        // (itemStats:All, itemStats:Shyam, etc.). Clearing everything ensures consistent
        // data across all potential views after a write.
        statsCache.flushAll();
    }
}

export default new ItemService();