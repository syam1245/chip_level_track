import ItemRepository from "./items.repository.js";
import AppError from "../../core/errors/AppError.js";
import NodeCache from "node-cache";
import { enrichWithAging, computeAgingSummary } from "./items.aging.js";
import { buildSearchQuery, buildSortOptions } from "./items.query-builder.js";
import { STATUS_GROUPS } from "./domain/jobStatus.domain.js";
import { buildNewJobData, applyFieldUpdates, applyStatusChange } from "./domain/job.domain.js";
import { buildTechnicianFilter } from "./domain/technician.domain.js";
import { ALLOWED_STATUSES } from "../../constants/status.js";
import { eventBus, EVENTS } from "../../core/events/eventBus.js";

const statsCache = new NodeCache({ stdTTL: 300 });

class ItemService {
    async getItems({ page, limit, search, statusGroup, userRole, includeMetadata, sortBy, sortOrder, technicianName }) {
        const skip = (page - 1) * limit;
        const query = buildSearchQuery({ search, statusGroup, technicianName });
        const sortObject = buildSortOptions({ sortBy, sortOrder });
        const showMetadata = userRole === "admin" && includeMetadata === "true";

        // ── Stat counts (cached per technician) ────────────────────────
        const { inProgress, ready, returned } = await this._getStatCounts(technicianName);

        // ── Total is free — derived from stat counts ───────────────────
        const total = inProgress + ready + returned;

        // ── Fetch current page of items ────────────────────────────────
        const items = await ItemRepository.findAll({ query, skip, limit, showMetadata, sort: sortObject });

        // ── Enrich items with aging info (in-place, O(pageSize)) ───────
        const now = Date.now();
        for (const item of items) {
            enrichWithAging(item, now);
        }

        // ── Filtered total for pagination ──────────────────────────────
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

        // Domain: build the initial job data structure
        const itemData = buildNewJobData(data, user);

        const newItem = await ItemRepository.create(itemData);
        
        // Clear local cache
        this._invalidateCache();
        
        // Fire domain event (listeners will handle broadcasting, etc.)
        eventBus.emit(EVENTS.JOB_CREATED, { jobNumber: newItem.jobNumber });
        
        return newItem;
    }

    async updateItem(id, data) {
        const item = await ItemRepository.findById(id);
        if (!item) {
            throw new AppError("Item not found", 404);
        }

        // Domain: apply field-level updates
        applyFieldUpdates(item, data);

        // Domain: apply status change + business-rule side effects
        let statusChanged = false;
        let revenueRealized = false;
        let revenueRealizedDate = null;

        if (data.status) {
            const result = applyStatusChange(item, data);

            if (result.reason) {
                throw new AppError(result.reason, 400);
            }

            statusChanged = result.changed;
            revenueRealized = result.revenueRealized;
            if (revenueRealized) {
                revenueRealizedDate = item.revenueRealizedAt;
            }
        }

        const savedItem = await item.save();

        // Emit domain events
        eventBus.emit(EVENTS.JOB_UPDATED, { id });
        
        if (statusChanged) {
            this._invalidateCache();
            eventBus.emit(EVENTS.JOB_STATUS_CHANGED, {
                id,
                jobNumber: savedItem.jobNumber,
                newStatus: savedItem.status
            });
            
            if (revenueRealized) {
                eventBus.emit(EVENTS.JOB_REVENUE_REALIZED, { date: revenueRealizedDate });
            }
        }

        return savedItem;
    }

    async deleteItem(id) {
        const item = await ItemRepository.findById(id);
        if (!item) {
            throw new AppError("Item not found", 404);
        }

        const deleted = await ItemRepository.softDelete(id);
        this._invalidateCache();
        
        eventBus.emit(EVENTS.JOB_DELETED, { id });
        return deleted;
    }

    async bulkDeleteItems(ids) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new AppError("ids must be a non-empty array", 400);
        }

        const result = await ItemRepository.bulkSoftDelete(ids);
        this._invalidateCache();
        
        eventBus.emit(EVENTS.JOB_BULK_UPDATED, { count: ids.length, isDelete: true });
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
            await Promise.all([
                ItemRepository.bulkSetRevenueRealized(ids),
                ItemRepository.bulkSetDueDateIfNull(ids),
            ]);
            eventBus.emit(EVENTS.JOB_REVENUE_REALIZED, { date: new Date() });
        }

        this._invalidateCache();
        eventBus.emit(EVENTS.JOB_BULK_UPDATED, { count: ids.length, status: newStatus });
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
        const techFilter = buildTechnicianFilter(technicianName);
        if (techFilter) {
            matchStage.technicianName = techFilter;
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
        statsCache.flushAll();
    }
}

export default new ItemService();