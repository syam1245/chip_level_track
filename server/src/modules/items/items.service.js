import ItemRepository from "./items.repository.js";
import AppError from "../../core/errors/AppError.js";
import NodeCache from "node-cache";
import { enrichWithAging, computeAgingSummary } from "./items.aging.js";
import { buildSearchQuery, buildSortOptions, STATUS_GROUPS } from "./items.query-builder.js";

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

        const filteredTotal = (search || statusGroup)
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

        statsCache.del("itemStats");
        return await ItemRepository.create(itemData);
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
        if (data.cost !== undefined) item.cost = Number(data.cost) || 0;
        if (data.finalCost !== undefined) item.finalCost = Number(data.finalCost) || 0;
        if (data.technicianName !== undefined) item.technicianName = String(data.technicianName).trim();
        if (data.dueDate !== undefined) item.dueDate = data.dueDate ? new Date(data.dueDate) : null;

        if (data.status && data.status !== item.status) {
            item.status = data.status;
            item.statusHistory.push({
                status: data.status,
                note: data.repairNotes ? String(data.repairNotes).trim() : "",
                changedAt: new Date(),
            });
        }

        const savedItem = await item.save();
        if (data.status) {
            statsCache.del("itemStats");
        }
        return savedItem;
    }

    async deleteItem(id) {
        const item = await ItemRepository.findById(id);
        if (!item) {
            throw new AppError("Item not found", 404);
        }
        statsCache.del("itemStats");
        return await ItemRepository.softDelete(id);
    }

    async bulkUpdateStatus(ids, newStatus) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new AppError("ids must be a non-empty array", 400);
        }
        if (!newStatus) {
            throw new AppError("newStatus is required", 400);
        }

        const result = await ItemRepository.bulkUpdateStatus(ids, newStatus);
        statsCache.del("itemStats");
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
            ItemRepository.countDocuments({ isDeleted: false, status: { $in: STATUS_GROUPS.returned } }),
        ]);

        const stats = { inProgress, ready, returned };
        statsCache.set("itemStats", stats);
        return stats;
    }
}

export default new ItemService();
