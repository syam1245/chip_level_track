import ItemRepository from "./items.repository.js";
import AppError from "../../core/errors/AppError.js";
import NodeCache from "node-cache";
import { enrichWithAging, computeAgingSummary } from "./items.aging.js";
import { buildSearchQuery, buildSortOptions, STATUS_GROUPS } from "./items.query-builder.js";
import { broadcast } from "./items.events.js";
import StatsService from "../stats/stats.service.js";

const statsCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

class ItemService {
    async getItems({ page, limit, search, statusGroup, userRole, includeMetadata, sortBy, sortOrder, technicianName }) {
        const skip = (page - 1) * limit;
        const query = buildSearchQuery({ search, statusGroup, technicianName });
        const sortObject = buildSortOptions({ sortBy, sortOrder });
        const showMetadata = userRole === "admin" && includeMetadata === "true";

        // ── Stat counts (cached) ───────────────────────────────────────
        let { inProgress, ready, returned } = await this._getStatCounts();

        // ── Fetch page of items + total count ──────────────────────────
        const [items, total] = await Promise.all([
            ItemRepository.findAll({ query, skip, limit, showMetadata, sort: sortObject }),
            ItemRepository.countDocuments({ isDeleted: false })
        ]);

        // ── Enrich items with aging info (in-place, O(pageSize)) ───────
        const now = Date.now();
        for (const item of items) {
            enrichWithAging(item, now);
        }

        const filteredTotal = (search || statusGroup || (technicianName && technicianName !== "All"))
            ? await ItemRepository.countDocuments(query)
            : total;

        // ── Aging summary (cached — runs once every 5 min) ─────────────
        let agingSummary = statsCache.get("agingSummary");
        if (!agingSummary) {
            agingSummary = await computeAgingSummary();
            statsCache.set("agingSummary", agingSummary);
        }

        return {
            items,
            currentPage: page,
            totalPages: Math.ceil(filteredTotal / limit),
            totalItems: filteredTotal,
            stats: {
                total: total || 0,
                inProgress: inProgress || 0,
                ready: ready || 0,
                returned: returned || 0,
                agingSummary,
            },
        };
    }

    async createItem(data, user) {
        const existing = await ItemRepository.findByJobNumber(data.jobNumber);
        if (existing) {
            throw new AppError("Job number already exists", 400);
        }

        const itemData = {
            ...data,
            technicianName: user.displayName,
        };

        this._invalidateCache();
        const newItem = await ItemRepository.create(itemData);
        broadcast("job:created", { jobNumber: newItem.jobNumber });
        return newItem;
    }

    async updateItem(id, data) {
        const item = await ItemRepository.findById(id);
        if (!item) {
            throw new AppError("Item not found", 404);
        }

        if (data.customerName) item.customerName = String(data.customerName).trim();
        if (data.brand) item.brand = String(data.brand).trim();
        if (data.phoneNumber) item.phoneNumber = String(data.phoneNumber).trim();
        if (data.repairNotes !== undefined) item.repairNotes = String(data.repairNotes).trim();
        if (data.issue !== undefined) item.issue = String(data.issue).trim();
        if (data.finalCost !== undefined) item.finalCost = Number(data.finalCost) || 0;
        if (data.technicianName !== undefined) item.technicianName = String(data.technicianName).trim();
        if (data.dueDate !== undefined) item.dueDate = data.dueDate ? new Date(data.dueDate) : null;

        if (data.status && data.status !== item.status) {
            // Validate allowed status values to prevent invalid statuses in history
            const ALLOWED_STATUSES = ["Received", "Sent to Service", "In Progress", "Waiting for Parts", "Ready", "Delivered", "Return", "Pending"];
            if (!ALLOWED_STATUSES.includes(data.status)) {
                throw new AppError(`Invalid status: "${data.status}". Must be one of: ${ALLOWED_STATUSES.join(", ")}`, 400);
            }

            // Validation for Delivered status
            if (data.status === "Delivered" && !item.finalCost) {
                throw new AppError("A final amount must be provided before marking the job as Delivered.", 400);
            }

            item.status = data.status;
            item.statusHistory.push({
                status: data.status,
                note: data.repairNotes ? String(data.repairNotes).trim() : "",
                changedAt: new Date(),
            });

            // Set revenueRealizedAt when the repair finishes (if not already set)
            if ((data.status === "Ready" || data.status === "Delivered") && !item.revenueRealizedAt) {
                item.revenueRealizedAt = new Date();
                StatsService.invalidateRevenueCache(); // New revenue realized, invalidate reports
            }

            if (data.status === "Delivered") {
                item.deliveredAt = new Date();
            }
        }

        const savedItem = await item.save();
        if (data.status) {
            this._invalidateCache(); // status change may affect aging buckets
        }
        broadcast("job:updated", { id });
        return savedItem;
    }

    async deleteItem(id) {
        const item = await ItemRepository.findById(id);
        if (!item) {
            throw new AppError("Item not found", 404);
        }
        this._invalidateCache();
        const deleted = await ItemRepository.softDelete(id);
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

        // Validate against schema enum before hitting the DB
        const ALLOWED_STATUSES = ["Received", "Sent to Service", "In Progress", "Waiting for Parts", "Ready", "Delivered", "Return", "Pending"];
        if (!newStatus || !ALLOWED_STATUSES.includes(newStatus)) {
            throw new AppError(`Invalid status: "${newStatus}". Must be one of: ${ALLOWED_STATUSES.join(", ")}`, 400);
        }

        if (newStatus === "Delivered") {
            // Bulk update to Delivered is restricted to ensure final cost is verified.
            // Technicians should transition items individually to supply the final amount.
            throw new AppError('Cannot bulk update to "Delivered". Please update items individually to provide the final amount.', 400);
        }

        const result = await ItemRepository.bulkUpdateStatus(ids, newStatus);

        if (newStatus === "Ready") {
            // Bulk set revenueRealizedAt where it is not yet set
            await ItemRepository.bulkSetRevenueRealized(ids);
            StatsService.invalidateRevenueCache();
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

    async _getStatCounts() {
        const cached = statsCache.get("itemStats");
        if (cached) return cached;

        const [inProgress, ready, returned] = await Promise.all([
            ItemRepository.countDocuments({ isDeleted: false, status: { $in: STATUS_GROUPS.inProgress } }),
            ItemRepository.countDocuments({ isDeleted: false, status: { $in: STATUS_GROUPS.ready } }),
            ItemRepository.countDocuments({ isDeleted: false, status: { $in: STATUS_GROUPS.returned } })
        ]);

        const stats = { inProgress, ready, returned };

        statsCache.set("itemStats", stats);
        return stats;
    }

    _invalidateCache() {
        statsCache.del("itemStats");
        statsCache.del("agingSummary");
    }
}

export default new ItemService();
