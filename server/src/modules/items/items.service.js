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

        const [items, aggResult] = await Promise.all([
            ItemRepository.findAll({ query, skip, limit, showMetadata }),
            ItemRepository.aggregate([
                { $match: { isDeleted: false } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        inProgress: { $sum: { $cond: [{ $in: ["$status", ["Received", "In Progress", "Waiting for Parts", "Sent to Service"]] }, 1, 0] } },
                        ready: { $sum: { $cond: [{ $in: ["$status", ["Ready", "Delivered"]] }, 1, 0] } },
                        returned: { $sum: { $cond: [{ $in: ["$status", ["Pending", "Return"]] }, 1, 0] } },
                    },
                },
            ]),
        ]);

        const filteredTotal = (search || statusGroup)
            ? await ItemRepository.countDocuments(query)
            : (aggResult[0]?.total ?? 0);

        const statsRaw = aggResult[0] ?? {};
        const stats = {
            total: statsRaw.total ?? 0,
            inProgress: statsRaw.inProgress ?? 0,
            ready: statsRaw.ready ?? 0,
            returned: statsRaw.returned ?? 0,
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
