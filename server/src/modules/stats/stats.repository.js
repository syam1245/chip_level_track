import Item from "../items/models/item.model.js";

class StatsRepository {
    async getRevenueData(startDate, endDate) {
        const matchStage = {
            isDeleted: false,
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            cost: { $gt: 0 }
        };

        const totalRevenue = await Item.aggregate([
            { $match: matchStage },
            { $group: { _id: null, total: { $sum: "$cost" } } }
        ]);

        const revenueByUser = await Item.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$technicianName",
                    totalRevenue: { $sum: "$cost" },
                    deviceCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        return {
            total: totalRevenue[0]?.total || 0,
            breakdown: revenueByUser
        };
    }
}

export default new StatsRepository();
