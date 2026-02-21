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

    async getKeyStatistics(startDate, endDate) {
        const matchStage = {
            isDeleted: false,
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };

        const topBrand = await Item.aggregate([
            { $match: { ...matchStage, brand: { $nin: [null, "", " ", "Unknown"] } } },
            { $group: { _id: "$brand", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const topIssue = await Item.aggregate([
            { $match: { ...matchStage, issue: { $nin: [null, "", " ", "Unknown"] } } },
            { $group: { _id: "$issue", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const totalDevices = await Item.countDocuments(matchStage);

        return {
            mostProcessedBrand: topBrand[0]?._id || "None",
            mostCommonIssue: topIssue[0]?._id || "None",
            totalDevices
        };
    }
}

export default new StatsRepository();
