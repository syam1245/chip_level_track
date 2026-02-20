import ItemRepository from "./items.repository.js";
import AppError from "../../core/errors/AppError.js";

class ItemService {
    async getItems({ page, limit, search, statusGroup, userRole, includeMetadata }) {
        const skip = (page - 1) * limit;
        const query = { isDeleted: false };

        if (search) {
            const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            const searchRegex = new RegExp(escapeRegex(search), "i");
            query.$or = [
                { customerName: searchRegex },
                { brand: searchRegex },
                { jobNumber: searchRegex },
                { phoneNumber: searchRegex },
            ];
        }

        if (statusGroup === "inProgress") {
            query.status = { $in: ["Received", "In Progress", "Waiting for Parts", "Sent to Service"] };
        } else if (statusGroup === "ready") {
            query.status = { $in: ["Ready", "Delivered"] };
        } else if (statusGroup === "returned") {
            query.status = { $in: ["Pending", "Return"] };
        }

        const showMetadata = userRole === "admin" && includeMetadata === "true";

        const [items, total, inProgress, ready, returned] = await Promise.all([
            ItemRepository.findAll({ query, skip, limit, showMetadata }),
            ItemRepository.countDocuments({ isDeleted: false }),
            ItemRepository.countDocuments({ isDeleted: false, status: { $in: ["Received", "In Progress", "Waiting for Parts", "Sent to Service"] } }),
            ItemRepository.countDocuments({ isDeleted: false, status: { $in: ["Ready", "Delivered"] } }),
            ItemRepository.countDocuments({ isDeleted: false, status: { $in: ["Pending", "Return"] } })
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

        if (data.status && data.status !== item.status) {
            item.status = data.status;
            item.statusHistory.push({
                status: data.status,
                note: data.repairNotes ? String(data.repairNotes).trim() : "",
                changedAt: new Date(),
            });
        }

        return await item.save();
    }

    async deleteItem(id) {
        const item = await ItemRepository.findById(id);
        if (!item) {
            throw new AppError("Item not found", 404);
        }
        return await ItemRepository.softDelete(id);
    }

    async getBackup() {
        return await ItemRepository.findAllForBackup();
    }
}

export default new ItemService();
