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
        // Intentionally no isDeleted filter — soft-deleted job numbers remain
        // reserved to prevent reuse, which would create confusing history.
        return await Item.findOne({ jobNumber });
    }

    async create(data) {
        return await new Item(data).save();
    }

    // NOTE: update() via findByIdAndUpdate was removed — it was never called.
    // items.service.js uses findById() + document.save() to get Mongoose
    // validation, pre-save hooks (formattedDate), and statusHistory pushes.
    // findByIdAndUpdate bypasses all of those — do not reintroduce it.

    async softDelete(id) {
        return await Item.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }

    async bulkSoftDelete(ids) {
        return await Item.updateMany(
            { _id: { $in: ids } },
            { $set: { isDeleted: true } }
        );
    }

    async findAllForBackup() {
        return await Item.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();
    }

    async bulkUpdateStatus(ids, newStatus) {
        const historyEntry = { status: newStatus, note: "Bulk status update", changedAt: new Date() };
        return await Item.updateMany(
            { _id: { $in: ids }, isDeleted: false },
            {
                $set:  { status: newStatus },
                $push: { statusHistory: historyEntry },
            }
        );
    }

    async bulkSetRevenueRealized(ids) {
        return await Item.updateMany(
            { _id: { $in: ids }, isDeleted: false, revenueRealizedAt: null },
            { $set: { revenueRealizedAt: new Date() } }
        );
    }

    async bulkSetDueDateIfNull(ids) {
        return await Item.updateMany(
            { _id: { $in: ids }, isDeleted: false, dueDate: null },
            { $set: { dueDate: new Date() } }
        );
    }

    async findByTrackingDetails(jobNumber, phoneNumber) {
        // Deliberately limited field selection — this is a public endpoint.
        // Customer name and phone number are not returned to avoid exposing PII.
        return await Item.findOne({ jobNumber, phoneNumber, isDeleted: false })
            .select("jobNumber status brand issue finalCost updatedAt")
            .lean();
    }
}

export default new ItemRepository();