import ItemRepository from "./items.repository.js";
import AppError from "../../core/errors/AppError.js";
import NodeCache from "node-cache";

const statsCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

class ItemService {
    async getItems({ page, limit, search, statusGroup, userRole, includeMetadata, sortBy, sortOrder, technicianName }) {
        const skip = (page - 1) * limit;
        const query = { isDeleted: false };

        if (search) {
            // $text uses the compound text index on (customerName, brand, jobNumber, phoneNumber)
            // — dramatically faster than $regex on large collections since it uses the index.
            // Trade-off: matches whole words/tokens (e.g., full job number or full name).
            query.$text = { $search: search };
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

        const filteredTotal = (search || statusGroup)
            ? await ItemRepository.countDocuments(query)
            : total;

        const stats = {
            total: total || 0,
            inProgress: inProgress || 0,
            ready: ready || 0,
            returned: returned || 0,
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

    async getBackup() {
        return await ItemRepository.findAllForBackup();
    }
}

export default new ItemService();
