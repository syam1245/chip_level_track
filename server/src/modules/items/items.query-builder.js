/**
 * Query-building utilities for the Items module.
 * Constructs MongoDB filter objects, sort options, and status-group mappings
 * without any direct DB calls — pure functions that return query descriptors.
 */

import { ALLOWED_STATUSES } from "../../constants/status.js";
import { ACTIVE_STATUSES } from "./items.aging.js";

// ── Status group mappings ──────────────────────────────────────────────────
// These groupings are semantic business decisions — they cannot be derived
// automatically from ALLOWED_STATUSES. However, every status in ALLOWED_STATUSES
// must belong to exactly one group, enforced by the dev-time check below.
const STATUS_GROUPS = {
    inProgress: ["Received", "In Progress", "Waiting for Parts", "Sent to Service", "Pending"],
    ready:      ["Ready", "Delivered"],
    returned:   ["Return"],
};

// ── Dev-time completeness check ───────────────────────────────────────────────
// If a new status is added to status.js but not placed in a STATUS_GROUP,
// it will silently be excluded from all stat counts (inProgress/ready/returned).
// This check catches the omission immediately at startup.
if (process.env.NODE_ENV !== "production") {
    const allGrouped = new Set(Object.values(STATUS_GROUPS).flat());
    const missing = ALLOWED_STATUSES.filter((s) => !allGrouped.has(s));
    const extra   = [...allGrouped].filter((s) => !ALLOWED_STATUSES.includes(s));

    if (missing.length) {
        throw new Error(
            `[items.query-builder.js] These statuses are in ALLOWED_STATUSES but not in any STATUS_GROUP: ${missing.join(", ")}`
        );
    }
    if (extra.length) {
        throw new Error(
            `[items.query-builder.js] These statuses are in STATUS_GROUPS but not in ALLOWED_STATUSES: ${extra.join(", ")}`
        );
    }
}

/**
 * Build the MongoDB filter query from search/filter parameters.
 * @returns {object} A MongoDB query object
 */
export function buildSearchQuery({ search, statusGroup, technicianName }) {
    const query = { isDeleted: false };

    // ── Full-text search ───────────────────────────────────────────────
    if (search) {
        const trimmedSearch = search.trim();
        if (trimmedSearch) {
            query.$text = { $search: trimmedSearch };
        }
    }

    // ── Technician filter ──────────────────────────────────────────────
    // Shyam's displayName is "Shyam (Admin)" — stored as technicianName in DB.
    // The $in handles both the full display name and the base name so filtering
    // by either variant returns the same results.
    if (technicianName && technicianName !== "All") {
        const baseName = technicianName.replace(/\s*\(Admin\)\s*$/i, "");
        if (baseName !== technicianName) {
            query.technicianName = { $in: [technicianName, baseName] };
        } else {
            query.technicianName = technicianName;
        }
    }

    // ── Status group filter ────────────────────────────────────────────
    if (statusGroup === "needsAttention") {
        query.status = { $in: ACTIVE_STATUSES };
        const sixDaysAgo = new Date();
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
        query.createdAt = { $lte: sixDaysAgo };
    } else if (statusGroup && STATUS_GROUPS[statusGroup]) {
        query.status = { $in: STATUS_GROUPS[statusGroup] };
    }

    return query;
}

/**
 * Build the MongoDB sort descriptor.
 * @returns {object} A MongoDB sort object (e.g. { createdAt: -1 })
 */
const ALLOWED_SORT_FIELDS = new Set([
    "createdAt", "customerName", "brand", "status", "jobNumber",
    "finalCost", "technicianName", "dueDate", "updatedAt",
]);

export function buildSortOptions({ sortBy, sortOrder }) {
    if (!sortBy || !ALLOWED_SORT_FIELDS.has(sortBy)) return { createdAt: -1 };

    const order = sortOrder === "asc" ? 1 : -1;
    const sortObject = { [sortBy]: order };

    // Secondary sort by createdAt for deterministic ordering when primary values are equal
    if (sortBy !== "createdAt") {
        sortObject.createdAt = -1;
    }

    return sortObject;
}

/**
 * The status-group query filters, exported for stat-counting reuse in items.service.js.
 */
export { STATUS_GROUPS };