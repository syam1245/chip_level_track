import Item from "./models/item.model.js";

class ItemRepository {
    async findAll({ query, skip, limit, showMetadata = false }) {
        let queryBuilder = Item.find(query)
            .sort({ createdAt: -1 })
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

    // Backup utility: find all non-deleted items
    async findAllForBackup() {
        return await Item.find().sort({ createdAt: -1 });
    }
}

export default new ItemRepository();
