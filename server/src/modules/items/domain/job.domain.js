/**
 * Job domain logic.
 *
 * Pure business rules for job entity operations — field updates,
 * status change side-effects, and new job construction.
 * No database calls, no HTTP concerns.
 */

import { validateStatusTransition } from "./jobStatus.domain.js";
import { ALLOWED_STATUSES } from "../../../constants/status.js";

/**
 * Build the initial data object for a new job.
 *
 * @param {object} data — validated input fields
 * @param {object} user — authenticated user (needs displayName)
 * @returns {object} — ready-to-persist job data
 */
export function buildNewJobData(data, user) {
    const initialStatus = data.status || "Received";

    return {
        ...data,
        status: initialStatus,
        technicianName: user.displayName,
        statusHistory: [{
            status:    initialStatus,
            note:      data.repairNotes ? String(data.repairNotes).trim() : "Job Created",
            changedAt: new Date(),
        }],
    };
}

/**
 * Apply field-level updates to an existing job document (in-place mutation).
 * Only touches fields that are present in `data`.
 *
 * @param {object} item — Mongoose document
 * @param {object} data — incoming update fields
 */
export function applyFieldUpdates(item, data) {
    if (data.customerName)               item.customerName    = String(data.customerName).trim();
    if (data.brand)                      item.brand           = String(data.brand).trim();
    if (data.phoneNumber)                item.phoneNumber     = String(data.phoneNumber).trim();
    if (data.repairNotes !== undefined)   item.repairNotes    = String(data.repairNotes).trim();
    if (data.issue !== undefined)         item.issue          = String(data.issue).trim();
    if (data.finalCost !== undefined)     item.finalCost      = Number(data.finalCost) || 0;
    if (data.technicianName !== undefined) item.technicianName = String(data.technicianName).trim();
    if (data.dueDate !== undefined)       item.dueDate        = data.dueDate ? new Date(data.dueDate) : null;
}

/**
 * Apply a status change and all its business-rule side effects.
 * Mutates `item` in place. Returns a `sideEffects` descriptor so the
 * service layer knows what cache invalidations / external calls to make.
 *
 * @param {object} item — Mongoose document (must have .status, .statusHistory, etc.)
 * @param {object} data — incoming update (must have .status)
 * @returns {{ changed: boolean, revenueRealized: boolean, reason?: string }}
 * @throws {Error} when the transition is invalid (caller should wrap in AppError)
 */
export function applyStatusChange(item, data) {
    if (!data.status || data.status === item.status) {
        return { changed: false, revenueRealized: false };
    }

    // ── Validate transition ──────────────────────────────────────────
    const result = validateStatusTransition(item.status, data.status);
    if (!result.valid) {
        return { changed: false, revenueRealized: false, reason: result.reason };
    }

    // ── Pre-transition business rules ────────────────────────────────
    if (data.status === "Delivered" && !item.finalCost) {
        return {
            changed: false,
            revenueRealized: false,
            reason: "A final amount must be provided before marking the job as Delivered.",
        };
    }

    // ── Apply the status change ──────────────────────────────────────
    item.status = data.status;
    item.statusHistory.push({
        status:    data.status,
        note:      data.repairNotes ? String(data.repairNotes).trim() : "",
        changedAt: new Date(),
    });

    // ── Post-transition side effects ─────────────────────────────────
    let revenueRealized = false;

    if (data.status === "Ready") {
        if (!item.dueDate) item.dueDate = new Date();
        if (!item.revenueRealizedAt) {
            item.revenueRealizedAt = new Date();
            revenueRealized = true;
        }
    } else if (data.status === "Delivered") {
        if (!item.revenueRealizedAt) {
            item.revenueRealizedAt = new Date();
            revenueRealized = true;
        }
        item.deliveredAt = new Date();
    }

    return { changed: true, revenueRealized };
}
