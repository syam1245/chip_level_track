/**
 * Job Aging Utility — client-side tier computation and display helpers.
 *
 * Aging logic:
 *   - "fresh"      0-3 days  → no indicator (normal pace)
 *   - "normal"     4-5 days  → subtle grey tag (on track)
 *   - "attention"  6-7 days  → amber indicator (approaching SLA)
 *   - "overdue"    8-14 days → warm orange (past SLA, needs action)
 *   - "critical"   15+ days  → red pulse (urgent)
 *
 * Closed statuses ("Delivered", "Return") are exempt — they're done.
 */

const CLOSED_STATUSES = new Set(["Delivered", "Return"]);

/** Aging tier thresholds (in days) */
const TIERS = [
    { max: 3, tier: "fresh", label: null, color: null },
    { max: 5, tier: "normal", label: null, color: null },
    { max: 7, tier: "attention", label: "Approaching SLA", color: "#f59e0b" }, // Amber
    { max: 14, tier: "overdue", label: "Needs Attention", color: "#f97316" }, // Orange
    { max: Infinity, tier: "critical", label: "Urgent", color: "#ef4444" }, // Red
];

/**
 * Compute the aging information for a single item on the client side.
 * If the server already provided `ageDays` and `agingTier`, use those.
 * Otherwise, compute locally from `createdAt`.
 *
 * @param {Object} item — a job item from the API
 * @returns {{ ageDays: number, tier: string, label: string|null, color: string|null, isAging: boolean }}
 */
export function getAgingInfo(item) {
    if (CLOSED_STATUSES.has(item.status)) {
        return { ageDays: 0, tier: "closed", label: null, color: null, isAging: false };
    }

    const ageDays = typeof item.ageDays === "number"
        ? item.ageDays
        : Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 86_400_000);

    const match = TIERS.find((t) => ageDays <= t.max) || TIERS[TIERS.length - 1];

    return {
        ageDays,
        tier: match.tier,
        label: match.label,
        color: match.color,
        isAging: match.tier === "attention" || match.tier === "overdue" || match.tier === "critical",
    };
}

/**
 * Human-friendly age text, e.g. "3d", "1w 2d", "2w+".
 * Compact by design — fits in a tiny chip.
 */
export function formatAge(days) {
    if (days < 1) return "Today";
    if (days === 1) return "1d";
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    const remaining = days % 7;
    if (weeks >= 3) return `${weeks}w+`;
    return remaining > 0 ? `${weeks}w ${remaining}d` : `${weeks}w`;
}
