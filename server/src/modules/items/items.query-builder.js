/**
 * Query-building utilities for the Items module.
 * Constructs MongoDB filter objects, sort options, and status-group mappings
 * without any direct DB calls — pure functions that return query descriptors.
 */

import { ACTIVE_STATUSES } from "./items.aging.js";
import { STATUS_GROUPS } from "./domain/jobStatus.domain.js";
import { buildTechnicianFilter } from "./domain/technician.domain.js";

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
    const techFilter = buildTechnicianFilter(technicianName);
    if (techFilter) {
        query.technicianName = techFilter;
    }

    // ── Status group filter ────────────────────────────────────────────
    if (statusGroup === "needsAttention") {
        query.status = { $in: ACTIVE_STATUSES };
        const sixDaysAgo = new Date(Date.now() - 6 * 86_400_000);
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
 * Re-export STATUS_GROUPS from domain for backward compatibility.
 */
export { STATUS_GROUPS };