import Item from "../items/models/item.model.js";

class StatsRepository {
    async getRevenueData(startDate, endDate) {
        // Inclusive end-of-day ceiling so date range includes the full end date
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        const matchStage = {
            isDeleted: false,
            $or: [
                { revenueRealizedAt: { $gte: new Date(startDate), $lte: endOfDay } },
                { revenueRealizedAt: { $exists: false }, createdAt: { $gte: new Date(startDate), $lte: endOfDay } },
                { revenueRealizedAt: null, createdAt: { $gte: new Date(startDate), $lte: endOfDay } }
            ],
            // Include items that have a final cost
            $and: [
                { finalCost: { $gt: 0 } }
            ]
        };

        // Use finalCost as revenue
        const revenueExpr = "$finalCost";

        // Single round-trip to MongoDB using $facet
        const [result] = await Item.aggregate([
            { $match: matchStage },
            {
                $facet: {
                    // Overall total
                    total: [
                        { $group: { _id: null, amount: { $sum: revenueExpr } } },
                    ],
                    // Per-technician breakdown
                    breakdown: [
                        {
                            $group: {
                                _id: "$technicianName",
                                totalRevenue: { $sum: revenueExpr },
                                deviceCount: { $sum: 1 },
                            },
                        },
                        { $sort: { totalRevenue: -1 } },
                    ],
                },
            },
        ]);

        return {
            total: result?.total?.[0]?.amount || 0,
            breakdown: result?.breakdown || [],
        };
    }
}

export default new StatsRepository();
