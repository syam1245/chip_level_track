/**
 * jobStatus.domain.test.js
 *
 * Pure unit tests for status transition validation and status groups.
 * No mocks needed — these are pure functions.
 */

import {
    validateStatusTransition,
    STATUS_GROUPS,
    VALID_TRANSITIONS,
} from "../../modules/items/domain/jobStatus.domain.js";

import { ALLOWED_STATUSES } from "../../constants/status.js";

// ═════════════════════════════════════════════════════════════════════════════
// validateStatusTransition
// ═════════════════════════════════════════════════════════════════════════════

describe("validateStatusTransition", () => {

    // ── Happy-path transitions ────────────────────────────────────────
    test.each([
        ["Received",          "Sent to Service"],
        ["Received",          "In Progress"],
        ["Received",          "Pending"],
        ["Sent to Service",   "In Progress"],
        ["Sent to Service",   "Waiting for Parts"],
        ["In Progress",       "Waiting for Parts"],
        ["In Progress",       "Ready"],
        ["In Progress",       "Pending"],
        ["Waiting for Parts", "In Progress"],
        ["Waiting for Parts", "Ready"],
        ["Pending",           "In Progress"],
        ["Pending",           "Received"],
        ["Ready",             "Delivered"],
        ["Ready",             "Return"],
    ])("%s → %s is valid", (from, to) => {
        const result = validateStatusTransition(from, to);
        expect(result.valid).toBe(true);
        expect(result.reason).toBeUndefined();
    });

    // ── No-op (same status) ──────────────────────────────────────────
    test("same status → same status is valid (no-op)", () => {
        const result = validateStatusTransition("In Progress", "In Progress");
        expect(result.valid).toBe(true);
    });

    // ── Invalid transitions ──────────────────────────────────────────
    test.each([
        ["Delivered",  "In Progress",  "terminal"],
        ["Delivered",  "Received",     "terminal"],
        ["Return",     "In Progress",  "terminal"],
        ["Ready",      "Received",     "not allowed"],
        ["Received",   "Delivered",    "not allowed"],
        ["Received",   "Ready",        "not allowed"],
    ])("%s → %s is invalid (%s)", (from, to) => {
        const result = validateStatusTransition(from, to);
        expect(result.valid).toBe(false);
        expect(result.reason).toBeDefined();
    });

    // ── Invalid status name ──────────────────────────────────────────
    test("rejects a completely invalid status name", () => {
        const result = validateStatusTransition("Received", "Banana");
        expect(result.valid).toBe(false);
        expect(result.reason).toMatch(/Invalid status/);
    });

    test("rejects an unknown current status", () => {
        const result = validateStatusTransition("Nonexistent", "Ready");
        expect(result.valid).toBe(false);
        expect(result.reason).toMatch(/Unknown current status/);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// VALID_TRANSITIONS completeness
// ═════════════════════════════════════════════════════════════════════════════

describe("VALID_TRANSITIONS", () => {

    test("has an entry for every ALLOWED_STATUS", () => {
        for (const status of ALLOWED_STATUSES) {
            expect(VALID_TRANSITIONS).toHaveProperty(status);
        }
    });

    test("every target status is itself an ALLOWED_STATUS", () => {
        for (const [, targets] of Object.entries(VALID_TRANSITIONS)) {
            for (const target of targets) {
                expect(ALLOWED_STATUSES).toContain(target);
            }
        }
    });

    test("terminal statuses (Delivered, Return) have empty transition arrays", () => {
        expect(VALID_TRANSITIONS["Delivered"]).toEqual([]);
        expect(VALID_TRANSITIONS["Return"]).toEqual([]);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// STATUS_GROUPS completeness
// ═════════════════════════════════════════════════════════════════════════════

describe("STATUS_GROUPS", () => {

    test("every ALLOWED_STATUS belongs to exactly one group", () => {
        const allGrouped = Object.values(STATUS_GROUPS).flat();
        for (const status of ALLOWED_STATUSES) {
            const count = allGrouped.filter((s) => s === status).length;
            expect(count).toBe(1);
        }
    });

    test("no extra statuses in groups that aren't in ALLOWED_STATUSES", () => {
        const allGrouped = Object.values(STATUS_GROUPS).flat();
        for (const status of allGrouped) {
            expect(ALLOWED_STATUSES).toContain(status);
        }
    });
});
