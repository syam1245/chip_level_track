/**
 * Technician domain logic.
 *
 * Single source of truth for technician name normalization and
 * query-building. Previously, the "(Admin)" stripping RegExp was
 * duplicated in items.service.js, items.query-builder.js,
 * items.aging.js, and stats.repository.js.
 */

const ADMIN_SUFFIX_RE = /\s*\(Admin\)\s*$/i;

/**
 * Strip the "(Admin)" suffix from a technician display name.
 * @param {string} name — e.g. "Shyam (Admin)"
 * @returns {string}     — e.g. "Shyam"
 */
export function normalizeTechnicianName(name) {
    if (!name || typeof name !== "string") return name;
    return name.replace(ADMIN_SUFFIX_RE, "");
}

/**
 * Build a MongoDB-compatible technicianName filter.
 * When the raw name contains "(Admin)", the filter matches both the full
 * display name and the stripped base name so historical data is always
 * included.
 *
 * @param {string} rawName — the technician name as received from the client
 * @returns {string|object|null} — a MongoDB query value, or null if "All"
 */
export function buildTechnicianFilter(rawName) {
    if (!rawName || rawName === "All") return null;

    const baseName = normalizeTechnicianName(rawName);
    if (baseName !== rawName) {
        return { $in: [rawName, baseName] };
    }
    return rawName;
}
