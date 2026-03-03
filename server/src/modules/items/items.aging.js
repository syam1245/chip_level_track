import ItemRepository from "./items.repository.js";

// ── Aging tier constants ───────────────────────────────────────────────────
// Closed statuses are exempt from aging — the job is done.
export const CLOSED_STATUSES = new Set(["Delivered", "Return"]);
export const ACTIVE_STATUSES = ["Received", "In Progress", "Waiting for Parts", "Sent to Service", "Ready", "Pending"];

// Tier thresholds (days) — must be in ascending order.
const AGING_TIERS = [
    { max: 3, tier: "fresh" },
    { max: 5, tier: "normal" },
    { max: 7, tier: "attention" },
    { max: 14, tier: "overdue" },
    { max: Infinity, tier: "critical" },
];

/** Classify a number of days into an aging tier string */
export function getAgingTier(days) {
    for (const t of AGING_TIERS) {
        if (days <= t.max) return t.tier;
    }
    return "critical";
}

/** Compute ageDays and agingTier for a single item (in-place mutation on lean doc) */
export function enrichWithAging(item, now) {
    if (CLOSED_STATUSES.has(item.status)) {
        item.ageDays = 0;
        item.agingTier = "closed";
    } else {
        const created = new Date(item.createdAt).getTime();
        item.ageDays = Math.max(0, Math.floor((now - created) / 86_400_000));
        item.agingTier = getAgingTier(item.ageDays);
    }
    return item;
}

/**
 * Compute aging summary counts using a single MongoDB aggregation.
 * Uses $dateDiff (MongoDB 5+) for server-side date math — avoids
 * pulling every document into Node memory.
 *
 * Returns: { attention: N, overdue: N, critical: N, total: N }
 */
export async function computeAgingSummary() {
    const now = new Date();
    try {
        const pipeline = [
            { $match: { isDeleted: false, status: { $in: ACTIVE_STATUSES } } },
            {
                $addFields: {
                    ageDays: {
                        $dateDiff: { startDate: "$createdAt", endDate: now, unit: "day" }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    attention: { $sum: { $cond: [{ $and: [{ $gte: ["$ageDays", 6] }, { $lte: ["$ageDays", 7] }] }, 1, 0] } },
                    overdue: { $sum: { $cond: [{ $and: [{ $gte: ["$ageDays", 8] }, { $lte: ["$ageDays", 14] }] }, 1, 0] } },
                    critical: { $sum: { $cond: [{ $gte: ["$ageDays", 15] }, 1, 0] } },
                }
            }
        ];

        const [result] = await ItemRepository.aggregate(pipeline);
        const summary = {
            attention: result?.attention || 0,
            overdue: result?.overdue || 0,
            critical: result?.critical || 0,
        };
        summary.total = summary.attention + summary.overdue + summary.critical;
        return summary;
    } catch (err) {
        // Fallback for MongoDB < 5.0 (no $dateDiff)
        // Use a date threshold approach instead
        const sixDaysAgo = new Date(now.getTime() - 6 * 86_400_000);
        const eightDaysAgo = new Date(now.getTime() - 8 * 86_400_000);
        const fifteenDaysAgo = new Date(now.getTime() - 15 * 86_400_000);

        const baseQuery = { isDeleted: false, status: { $in: ACTIVE_STATUSES } };

        const [attention, overdue, critical] = await Promise.all([
            ItemRepository.countDocuments({ ...baseQuery, createdAt: { $lte: sixDaysAgo, $gt: eightDaysAgo } }),
            ItemRepository.countDocuments({ ...baseQuery, createdAt: { $lte: eightDaysAgo, $gt: fifteenDaysAgo } }),
            ItemRepository.countDocuments({ ...baseQuery, createdAt: { $lte: fifteenDaysAgo } }),
        ]);

        return { attention, overdue, critical, total: attention + overdue + critical };
    }
}
