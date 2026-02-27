import Item from "./models/item.model.js";

class ItemRepository {
    async findAll({ query, skip, limit, showMetadata = false, sort = { createdAt: -1 } }) {
        let queryBuilder = Item.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        if (showMetadata) {
            queryBuilder = queryBuilder.select("+metadata");
        }

        return await queryBuilder;
    }

    async countDocuments(query) {
        return await Item.countDocuments(query);
    }

    async aggregate(pipeline) {
        return await Item.aggregate(pipeline);
    }

    async findById(id) {
        return await Item.findById(id);
    }

    async findByJobNumber(jobNumber) {
        return await Item.findOne({ jobNumber });
    }

    async create(data) {
        return await new Item(data).save();
    }

    async update(id, data) {
        return await Item.findByIdAndUpdate(id, data, { new: true });
    }

    async softDelete(id) {
        return await Item.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }

    // Backup utility: find all active (non-deleted) items only
    async findAllForBackup() {
        return await Item.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();
    }

    async bulkUpdateStatus(ids, newStatus) {
        const historyEntry = { status: newStatus, note: "Bulk status update", changedAt: new Date() };
        return await Item.updateMany(
            { _id: { $in: ids }, isDeleted: false },
            {
                $set: { status: newStatus },
                $push: { statusHistory: historyEntry },
            }
        );
    }

    async findByTrackingDetails(jobNumber, phoneNumber) {
        return await Item.findOne({
            jobNumber,
            phoneNumber,
            isDeleted: false
        })
            .select("-metadata -isDeleted -createdAt -updatedAt")
            .lean();
    }
}

export default new ItemRepository();
