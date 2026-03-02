import ItemRepository from "./items.repository.js";
import AppError from "../../core/errors/AppError.js";
import NodeCache from "node-cache";

const statsCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// ── Aging tier constants ───────────────────────────────────────────────────
// Closed statuses are exempt from aging — the job is done.
const CLOSED_STATUSES = new Set(["Delivered", "Return"]);
const ACTIVE_STATUSES = ["Received", "In Progress", "Waiting for Parts", "Sent to Service", "Ready", "Pending"];

// Tier thresholds (days) — must be in ascending order.
const AGING_TIERS = [
    { max: 3, tier: "fresh" },
    { max: 5, tier: "normal" },
    { max: 7, tier: "attention" },
    { max: 14, tier: "overdue" },
    { max: Infinity, tier: "critical" },
];

/** Classify a number of days into an aging tier string */
function getAgingTier(days) {
    for (const t of AGING_TIERS) {
        if (days <= t.max) return t.tier;
    }
    return "critical";
}

/** Compute ageDays and agingTier for a single item (in-place mutation on lean doc) */
function enrichWithAging(item, now) {
    if (CLOSED_STATUSES.has(item.status)) {
        item.ageDays = 0;
        item.agingTier = "closed";
    } else {
        const created = new Date(item.createdAt).getTime();
        item.ageDays = Math.max(0, Math.floor((now - created) / 86_400_000));
        item.agingTier = getAgingTier(item.ageDays);
    }
    return item;
}

class ItemService {
    async getItems({ page, limit, search, statusGroup, userRole, includeMetadata, sortBy, sortOrder, technicianName }) {
        const skip = (page - 1) * limit;
        const query = { isDeleted: false };

        if (search) {
            const isMultiWord = search.trim().includes(' ');

            // To prevent a MongoDB issue combining $text and $regex in an $or array without full indexing,
            // we conditionally use the $text index for complex/multi-word searches (faster),
            // and fallback to $regex for single-word partial searches (handles substrings like partial phone #).
            if (isMultiWord) {
                query.$text = { $search: `"${search}"` }; // Wrap in quotes for exact phrase text matching if possible
            } else {
                query.$or = [
                    { jobNumber: { $regex: search, $options: "i" } },
                    { customerName: { $regex: search, $options: "i" } },
                    { brand: { $regex: search, $options: "i" } },
                    { phoneNumber: { $regex: search, $options: "i" } }
                ];
            }
        }

        if (technicianName && technicianName !== 'All') {
            // If the technicianName contains "(Admin)", allow matching the base name as well
            // for backwards compatibility with jobs created before they were admins.
            const baseName = technicianName.replace(/\s*\(Admin\)\s*$/i, '');
            if (baseName !== technicianName) {
                query.technicianName = { $in: [technicianName, baseName] };
            } else {
                query.technicianName = technicianName;
            }
        }

        if (statusGroup === "inProgress") {
            query.status = { $in: ["Received", "In Progress", "Waiting for Parts", "Sent to Service"] };
        } else if (statusGroup === "ready") {
            query.status = { $in: ["Ready", "Delivered"] };
        } else if (statusGroup === "returned") {
            query.status = { $in: ["Pending", "Return"] };
        }

        let sortObject = { createdAt: -1 };
        if (sortBy) {
            const order = sortOrder === 'asc' ? 1 : -1;
            sortObject = { [sortBy]: order };
            // Add secondary sort by createdAt to keep things deterministic
            if (sortBy !== 'createdAt') {
                sortObject.createdAt = -1;
            }
        }

        const showMetadata = userRole === "admin" && includeMetadata === "true";

        let inProgress = 0;
        let ready = 0;
        let returned = 0;

        const cachedStats = statsCache.get("itemStats");
        if (cachedStats) {
            inProgress = cachedStats.inProgress;
            ready = cachedStats.ready;
            returned = cachedStats.returned;
        } else {
            [inProgress, ready, returned] = await Promise.all([
                ItemRepository.countDocuments({ isDeleted: false, status: { $in: ["Received", "In Progress", "Waiting for Parts", "Sent to Service"] } }),
                ItemRepository.countDocuments({ isDeleted: false, status: { $in: ["Ready", "Delivered"] } }),
                ItemRepository.countDocuments({ isDeleted: false, status: { $in: ["Pending", "Return"] } })
            ]);
            statsCache.set("itemStats", { inProgress, ready, returned });
        }

        const [items, total] = await Promise.all([
            ItemRepository.findAll({ query, skip, limit, showMetadata, sort: sortObject }),
            ItemRepository.countDocuments({ isDeleted: false })
        ]);

        // ── Enrich items with aging info (in-place, O(pageSize)) ──────────
        const now = Date.now();
        for (const item of items) {
            enrichWithAging(item, now);
        }

        const filteredTotal = (search || statusGroup)
            ? await ItemRepository.countDocuments(query)
            : total;

        // ── Aging summary (cached — runs once every 5 min) ────────────────
        let agingSummary = statsCache.get("agingSummary");
        if (!agingSummary) {
            agingSummary = await this._computeAgingSummary();
            statsCache.set("agingSummary", agingSummary);
        }

        const stats = {
            total: total || 0,
            inProgress: inProgress || 0,
            ready: ready || 0,
            returned: returned || 0,
            agingSummary,
        };

        return {
            items,
            currentPage: page,
            totalPages: Math.ceil(filteredTotal / limit),
            totalItems: filteredTotal,
            stats,
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

    /**
     * Compute aging summary counts using a single MongoDB aggregation.
     * Uses $dateDiff (MongoDB 5+) for server-side date math — avoids
     * pulling every document into Node memory.
     *
     * Returns: { attention: N, overdue: N, critical: N, total: N }
     */
    async _computeAgingSummary() {
        const now = new Date();
        try {
            const pipeline = [
                { $match: { isDeleted: false, status: { $in: ACTIVE_STATUSES } } },
                {
                    $addFields: {
                        ageDays: {
                            $dateDiff: { startDate: "$createdAt", endDate: now, unit: "day" }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        attention: { $sum: { $cond: [{ $and: [{ $gte: ["$ageDays", 6] }, { $lte: ["$ageDays", 7] }] }, 1, 0] } },
                        overdue: { $sum: { $cond: [{ $and: [{ $gte: ["$ageDays", 8] }, { $lte: ["$ageDays", 14] }] }, 1, 0] } },
                        critical: { $sum: { $cond: [{ $gte: ["$ageDays", 15] }, 1, 0] } },
                    }
                }
            ];

            const [result] = await ItemRepository.aggregate(pipeline);
            const summary = {
                attention: result?.attention || 0,
                overdue: result?.overdue || 0,
                critical: result?.critical || 0,
            };
            summary.total = summary.attention + summary.overdue + summary.critical;
            return summary;
        } catch (err) {
            // Fallback for MongoDB < 5.0 (no $dateDiff)
            // Use a date threshold approach instead
            const sixDaysAgo = new Date(now.getTime() - 6 * 86_400_000);
            const eightDaysAgo = new Date(now.getTime() - 8 * 86_400_000);
            const fifteenDaysAgo = new Date(now.getTime() - 15 * 86_400_000);

            const baseQuery = { isDeleted: false, status: { $in: ACTIVE_STATUSES } };

            const [attention, overdue, critical] = await Promise.all([
                ItemRepository.countDocuments({ ...baseQuery, createdAt: { $lte: sixDaysAgo, $gt: eightDaysAgo } }),
                ItemRepository.countDocuments({ ...baseQuery, createdAt: { $lte: eightDaysAgo, $gt: fifteenDaysAgo } }),
                ItemRepository.countDocuments({ ...baseQuery, createdAt: { $lte: fifteenDaysAgo } }),
            ]);

            return { attention, overdue, critical, total: attention + overdue + critical };
        }
    }
}

export default new ItemService();
