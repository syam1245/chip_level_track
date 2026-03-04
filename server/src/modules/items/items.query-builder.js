/**
 * Query-building utilities for the Items module.
 * Constructs MongoDB filter objects, sort options, and status-group mappings
 * without any direct DB calls — pure functions that return query descriptors.
 */

// ── Status group mappings ──────────────────────────────────────────────────
const STATUS_GROUPS = {
    inProgress: ["Received", "In Progress", "Waiting for Parts", "Sent to Service"],
    ready: ["Ready", "Delivered"],
    returned: ["Pending", "Return"],
};

/**
 * Build the MongoDB filter query from search/filter parameters.
 * @returns {object} A MongoDB query object
 */
export function buildSearchQuery({ search, statusGroup, technicianName }) {
    const query = { isDeleted: false };

    // ── Full-text vs regex search ──────────────────────────────────────
    if (search) {
        // Utilize the text index for primary search speed ( jobNumber, customerName, brand, phone )
        // We use $regex as a fallback/OR condition to handle partial word matches since
        // MongoDB text indexes are stem-based and might not catch mid-word substrings perfectly.
        query.$or = [
            { $text: { $search: `"${search}"` } },
            { jobNumber: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } },
            { brand: { $regex: search, $options: "i" } },
            { phoneNumber: { $regex: search, $options: "i" } },
        ];
    }

    // ── Technician filter ──────────────────────────────────────────────
    if (technicianName && technicianName !== "All") {
        const baseName = technicianName.replace(/\s*\(Admin\)\s*$/i, "");
        if (baseName !== technicianName) {
            query.technicianName = { $in: [technicianName, baseName] };
        } else {
            query.technicianName = technicianName;
        }
    }

    // ── Status group filter ────────────────────────────────────────────
    if (statusGroup && STATUS_GROUPS[statusGroup]) {
        query.status = { $in: STATUS_GROUPS[statusGroup] };
    }

    return query;
}

/**
 * Build the MongoDB sort descriptor.
 * @returns {object} A MongoDB sort object (e.g. { createdAt: -1 })
 */
export function buildSortOptions({ sortBy, sortOrder }) {
    if (!sortBy) return { createdAt: -1 };

    const order = sortOrder === "asc" ? 1 : -1;
    const sortObject = { [sortBy]: order };

    // Add secondary sort by createdAt to keep things deterministic
    if (sortBy !== "createdAt") {
        sortObject.createdAt = -1;
    }

    return sortObject;
}

/**
 * The status-group query filters, exported for stat-counting reuse.
 */
export { STATUS_GROUPS };
