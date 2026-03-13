import Item from "../items/models/item.model.js";

class StatsRepository {
    async getRevenueData(startDate, endDate) {
        // Use UTC end-of-day so the cutoff is timezone-independent.
        // setHours() uses local timezone — if the server timezone ever differs
        // from UTC, the cutoff shifts by the UTC offset. setUTCHours is correct.
        const endOfDay = new Date(endDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const start = new Date(startDate);

        // In MongoDB, { field: null } matches both null AND documents where
        // the field doesn't exist — so { revenueRealizedAt: { $exists: false } }
        // is fully covered by the null branch. Three conditions reduced to two.
        const matchStage = {
            isDeleted: false,
            finalCost: { $gt: 0 },
            $or: [
                { revenueRealizedAt: { $gte: start, $lte: endOfDay } },
                {
                    revenueRealizedAt: null,
                    status: { $in: ["Ready", "Delivered"] },
                    createdAt: { $gte: start, $lte: endOfDay }
                },
            ],
        };

        // Run the $facet aggregation and the pendingJobs count in parallel —
        // they are completely independent queries. Sequential was one extra
        // round-trip per stats request with no reason for it.
        const [aggregationResult, pendingJobs] = await Promise.all([
            Item.aggregate([
                { $match: matchStage },
                {
                    $addFields: {
                        // Normalize technician name by removing " (Admin)" suffix so
                        // historical data matches current names in the UI.
                        // Canonical definition: items/domain/technician.domain.js
                        // This in-DB $replaceAll mirrors the JS-side normalizeTechnicianName().
                        normalizedTech: {
                            $trim: {
                                input: {
                                    $replaceAll: {
                                        input: "$technicianName",
                                        find: " (Admin)",
                                        replacement: ""
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $facet: {
                        total: [
                            { $group: { _id: null, amount: { $sum: "$finalCost" } } },
                        ],
                        totalJobs: [
                            { $count: "count" },
                        ],
                        breakdown: [
                            {
                                $group: {
                                    _id: "$normalizedTech",
                                    totalRevenue: { $sum: "$finalCost" },
                                    deviceCount:  { $sum: 1 },
                                },
                            },
                            { $sort: { totalRevenue: -1 } },
                        ],
                    },
                },
            ]),
            // Global pending jobs — not constrained by date range
            Item.countDocuments({
                isDeleted: false,
                status: { $nin: ["Ready", "Delivered", "Return"] },
            }),
        ]);

        const [result] = aggregationResult;
        const breakdown    = result?.breakdown    || [];
        const topTechnician = breakdown.length > 0 ? breakdown[0]._id : "N/A";

        return {
            total:          result?.total?.[0]?.amount    || 0,
            totalJobs:      result?.totalJobs?.[0]?.count || 0,
            pendingJobs,
            topTechnician,
            breakdown,
        };
    }
}

export default new StatsRepository();