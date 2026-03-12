import ItemRepository from "./items.repository.js";
import { ALLOWED_STATUSES } from "../../constants/status.js";
import logger from "../../core/utils/logger.js";

const MS_PER_DAY = 86_400_000;

// ── Derive aging sets from ALLOWED_STATUSES ───────────────────────────────────
// Hardcoding these strings was a sync hazard — a new status added to status.js
// would silently be excluded from computeAgingSummary's $in filter and treated
// as active by enrichWithAging with no error or warning.
// Deriving from ALLOWED_STATUSES keeps them in sync automatically.
const CLOSED_STATUSES_ARRAY = ["Delivered", "Return"];
export const CLOSED_STATUSES = new Set(CLOSED_STATUSES_ARRAY);
export const ACTIVE_STATUSES = ALLOWED_STATUSES.filter(
    (s) => !CLOSED_STATUSES.has(s)
);

// ── Dev-time completeness check ───────────────────────────────────────────────
// Catches any status in ALLOWED_STATUSES that doesn't appear in either set.
if (process.env.NODE_ENV !== "production") {
    for (const status of ALLOWED_STATUSES) {
        if (!CLOSED_STATUSES.has(status) && !ACTIVE_STATUSES.includes(status)) {
            throw new Error(
                `[items.aging.js] Status "${status}" is in ALLOWED_STATUSES but ` +
                `not classified as active or closed. Update CLOSED_STATUSES_ARRAY.`
            );
        }
    }
}

// ── Aging tier constants ──────────────────────────────────────────────────────
// Thresholds must be in ascending order — getAgingTier walks them in order.
const AGING_TIERS = [
    { max: 3,        tier: "fresh"     },
    { max: 5,        tier: "normal"    },
    { max: 7,        tier: "attention" },
    { max: 14,       tier: "overdue"   },
    { max: Infinity, tier: "critical"  },
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
        item.ageDays   = 0;
        item.agingTier = "closed";
    } else {
        const created  = new Date(item.createdAt).getTime();
        item.ageDays   = Math.max(0, Math.floor((now - created) / MS_PER_DAY));
        item.agingTier = getAgingTier(item.ageDays);
    }
    return item;
}

/**
 * Compute aging summary counts using a single MongoDB aggregation.
 * Uses $dateDiff (MongoDB 5+) for server-side date math — avoids pulling
 * every document into Node memory.
 *
 * Falls back to threshold-based countDocuments for MongoDB < 5.0.
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
                        $dateDiff: { startDate: "$createdAt", endDate: now, unit: "day" },
                    },
                },
            },
            {
                $group: {
                    _id:       null,
                    attention: { $sum: { $cond: [{ $and: [{ $gte: ["$ageDays", 6]  }, { $lte: ["$ageDays", 7]  }] }, 1, 0] } },
                    overdue:   { $sum: { $cond: [{ $and: [{ $gte: ["$ageDays", 8]  }, { $lte: ["$ageDays", 14] }] }, 1, 0] } },
                    critical:  { $sum: { $cond: [{ $gte: ["$ageDays", 15] }, 1, 0] } },
                },
            },
        ];

        const [result] = await ItemRepository.aggregate(pipeline);
        const summary = {
            attention: result?.attention || 0,
            overdue:   result?.overdue   || 0,
            critical:  result?.critical  || 0,
        };
        summary.total = summary.attention + summary.overdue + summary.critical;
        return summary;

    } catch (err) {
        // Log before falling back — the original catch swallowed all errors silently.
        // A network timeout or replica set election would fall through to the fallback
        // and potentially return wrong data with no signal in the logs.
        // Only $dateDiff errors (MongoDB < 5.0) are expected here.
        logger.warn("computeAgingSummary: $dateDiff aggregation failed, using fallback:", err.message);

        // Fallback for MongoDB < 5.0: threshold-based countDocuments.
        // Date thresholds derived from AGING_TIERS to stay in sync with tier definitions.
        const sixDaysAgo     = new Date(now.getTime() -  6 * MS_PER_DAY);
        const eightDaysAgo   = new Date(now.getTime() -  8 * MS_PER_DAY);
        const fifteenDaysAgo = new Date(now.getTime() - 15 * MS_PER_DAY);

        const baseQuery = { isDeleted: false, status: { $in: ACTIVE_STATUSES } };

        const [attention, overdue, critical] = await Promise.all([
            ItemRepository.countDocuments({ ...baseQuery, createdAt: { $lte: sixDaysAgo,   $gt: eightDaysAgo   } }),
            ItemRepository.countDocuments({ ...baseQuery, createdAt: { $lte: eightDaysAgo, $gt: fifteenDaysAgo  } }),
            ItemRepository.countDocuments({ ...baseQuery, createdAt: { $lte: fifteenDaysAgo                     } }),
        ]);

        return { attention, overdue, critical, total: attention + overdue + critical };
    }
}