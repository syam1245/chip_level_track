/**
 * Job status domain logic.
 *
 * Defines the valid status transitions, status group classifications,
 * and provides validation functions — all pure business rules with
 * zero database dependencies.
 */

import { ALLOWED_STATUSES } from "../../../constants/status.js";

// ── Valid status transitions ─────────────────────────────────────────────────
// Each key lists the statuses it can move TO.
// Terminal statuses (Delivered, Return) have empty arrays.
const VALID_TRANSITIONS = Object.freeze({
    "Received":           ["Sent to Service", "In Progress", "Pending"],
    "Sent to Service":    ["In Progress", "Waiting for Parts"],
    "In Progress":        ["Waiting for Parts", "Ready", "Pending"],
    "Waiting for Parts":  ["In Progress", "Ready"],
    "Pending":            ["In Progress", "Received"],
    "Ready":              ["Delivered", "Return"],
    "Delivered":          [],
    "Return":             [],
});

/**
 * Validate whether a status transition is allowed.
 *
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateStatusTransition(currentStatus, newStatus) {
    if (!ALLOWED_STATUSES.includes(newStatus)) {
        return {
            valid: false,
            reason: `Invalid status: "${newStatus}". Must be one of: ${ALLOWED_STATUSES.join(", ")}`,
        };
    }

    if (currentStatus === newStatus) {
        return { valid: true }; // no-op, not a real transition
    }

    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed) {
        return {
            valid: false,
            reason: `Unknown current status: "${currentStatus}"`,
        };
    }

    if (!allowed.includes(newStatus)) {
        return {
            valid: false,
            reason: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(", ") || "none (terminal status)"}`,
        };
    }

    return { valid: true };
}

// ── Status group mappings ──────────────────────────────────────────────────────
// Semantic business groupings — used for stat counts and query filtering.
// Every ALLOWED_STATUS must belong to exactly one group.
export const STATUS_GROUPS = Object.freeze({
    inProgress: ["Received", "In Progress", "Waiting for Parts", "Sent to Service", "Pending"],
    ready:      ["Ready", "Delivered"],
    returned:   ["Return"],
});

// ── Dev-time completeness check ───────────────────────────────────────────────
// Catches any status added to ALLOWED_STATUSES but not placed in a group,
// or any group entry that isn't a valid status.
if (process.env.NODE_ENV !== "production") {
    const allGrouped = new Set(Object.values(STATUS_GROUPS).flat());
    const missing = ALLOWED_STATUSES.filter((s) => !allGrouped.has(s));
    const extra   = [...allGrouped].filter((s) => !ALLOWED_STATUSES.includes(s));

    if (missing.length) {
        throw new Error(
            `[jobStatus.domain.js] These statuses are in ALLOWED_STATUSES but not in any STATUS_GROUP: ${missing.join(", ")}`
        );
    }
    if (extra.length) {
        throw new Error(
            `[jobStatus.domain.js] These statuses are in STATUS_GROUPS but not in ALLOWED_STATUSES: ${extra.join(", ")}`
        );
    }

    // Also verify VALID_TRANSITIONS keys match ALLOWED_STATUSES
    const transitionKeys = Object.keys(VALID_TRANSITIONS);
    const missingTransitions = ALLOWED_STATUSES.filter((s) => !transitionKeys.includes(s));
    if (missingTransitions.length) {
        throw new Error(
            `[jobStatus.domain.js] These statuses are in ALLOWED_STATUSES but missing from VALID_TRANSITIONS: ${missingTransitions.join(", ")}`
        );
    }
}

export { VALID_TRANSITIONS };
