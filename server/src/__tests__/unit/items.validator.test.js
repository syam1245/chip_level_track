/**
 * items.validator.test.js
 *
 * Pure unit tests — no DB, no network, no mocks needed.
 * The validator is a stateless class that either throws AppError or returns true.
 */

import ItemValidator from "../../modules/items/items.validator.js";
import AppError      from "../../core/errors/AppError.js";
import { ALLOWED_STATUSES } from "../../constants/status.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convenience: assert that fn throws an AppError with the given HTTP status */
function expectAppError(fn, statusCode = 400) {
    expect(fn).toThrow(AppError);
    try { fn(); } catch (e) {
        expect(e.statusCode).toBe(statusCode);
    }
}

const VALID_CREATE = {
    jobNumber:    "JOB001",
    customerName: "Alice",
    brand:        "Samsung",
    phoneNumber:  "9876543210",
};

// ═════════════════════════════════════════════════════════════════════════════
// validateCreate
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemValidator.validateCreate", () => {

    // ── Required fields ───────────────────────────────────────────────

    test("returns true for a valid payload", () => {
        expect(ItemValidator.validateCreate(VALID_CREATE)).toBe(true);
    });

    test.each([
        ["jobNumber",    { ...VALID_CREATE, jobNumber:    "" }],
        ["customerName", { ...VALID_CREATE, customerName: "" }],
        ["brand",        { ...VALID_CREATE, brand:        "" }],
        ["phoneNumber",  { ...VALID_CREATE, phoneNumber:  "" }],
    ])("throws 400 when %s is missing", (_field, payload) => {
        expectAppError(() => ItemValidator.validateCreate(payload));
    });

    // ── Phone number format ───────────────────────────────────────────

    test("throws when phoneNumber has fewer than 10 digits", () => {
        expectAppError(() =>
            ItemValidator.validateCreate({ ...VALID_CREATE, phoneNumber: "98765" })
        );
    });

    test("throws when phoneNumber has more than 10 digits", () => {
        expectAppError(() =>
            ItemValidator.validateCreate({ ...VALID_CREATE, phoneNumber: "98765432101" })
        );
    });

    test("throws when phoneNumber contains letters", () => {
        expectAppError(() =>
            ItemValidator.validateCreate({ ...VALID_CREATE, phoneNumber: "abcd123456" })
        );
    });

    test("accepts exactly 10 digits", () => {
        expect(() =>
            ItemValidator.validateCreate({ ...VALID_CREATE, phoneNumber: "0000000000" })
        ).not.toThrow();
    });

    // ── Length limits ─────────────────────────────────────────────────

    test("throws when jobNumber exceeds 50 characters", () => {
        expectAppError(() =>
            ItemValidator.validateCreate({ ...VALID_CREATE, jobNumber: "J".repeat(51) })
        );
    });

    test("throws when customerName exceeds 100 characters", () => {
        expectAppError(() =>
            ItemValidator.validateCreate({ ...VALID_CREATE, customerName: "A".repeat(101) })
        );
    });

    test("throws when brand exceeds 50 characters", () => {
        expectAppError(() =>
            ItemValidator.validateCreate({ ...VALID_CREATE, brand: "B".repeat(51) })
        );
    });

    test("throws when issue exceeds 2000 characters", () => {
        expectAppError(() =>
            ItemValidator.validateCreate({ ...VALID_CREATE, issue: "x".repeat(2001) })
        );
    });

    test("throws when repairNotes exceeds 2000 characters", () => {
        expectAppError(() =>
            ItemValidator.validateCreate({ ...VALID_CREATE, repairNotes: "x".repeat(2001) })
        );
    });

    test("accepts optional fields at their exact length limits", () => {
        expect(() =>
            ItemValidator.validateCreate({
                ...VALID_CREATE,
                issue:       "x".repeat(2000),
                repairNotes: "x".repeat(2000),
            })
        ).not.toThrow();
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// validateUpdate
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemValidator.validateUpdate", () => {

    // ── Allowlist stripping ───────────────────────────────────────────

    test("strips keys not in ALLOWED_UPDATE_FIELDS", () => {
        const data = { status: "Ready", isDeleted: true, __proto__: {} };
        ItemValidator.validateUpdate(data);
        expect(data).not.toHaveProperty("isDeleted");
        expect(data).toHaveProperty("status");
    });

    test("returns true for an empty update object", () => {
        expect(ItemValidator.validateUpdate({})).toBe(true);
    });

    // ── Status validation ─────────────────────────────────────────────

    test("accepts all values in ALLOWED_STATUSES", () => {
        for (const status of ALLOWED_STATUSES) {
            expect(() => ItemValidator.validateUpdate({ status })).not.toThrow();
        }
    });

    test("throws for an unrecognised status", () => {
        expectAppError(() => ItemValidator.validateUpdate({ status: "FakeStatus" }));
    });

    // ── finalCost coercion & validation ───────────────────────────────

    test("coerces a string number to a numeric value in place", () => {
        const data = { finalCost: "1500.50" };
        ItemValidator.validateUpdate(data);
        expect(data.finalCost).toBe(1500.50);
    });

    test("coerces empty string finalCost to 0", () => {
        const data = { finalCost: "" };
        ItemValidator.validateUpdate(data);
        expect(data.finalCost).toBe(0);
    });

    test("coerces null finalCost to 0", () => {
        const data = { finalCost: null };
        ItemValidator.validateUpdate(data);
        expect(data.finalCost).toBe(0);
    });

    test("throws for a negative finalCost", () => {
        expectAppError(() => ItemValidator.validateUpdate({ finalCost: -100 }));
    });

    test("throws for a finalCost above 10,000,000", () => {
        expectAppError(() => ItemValidator.validateUpdate({ finalCost: 10_000_001 }));
    });

    test("throws for a non-numeric finalCost string", () => {
        expectAppError(() => ItemValidator.validateUpdate({ finalCost: "banana" }));
    });

    // ── dueDate validation ────────────────────────────────────────────

    test("normalises a valid ISO date string to a Date object", () => {
        const data = { dueDate: "2025-12-31" };
        ItemValidator.validateUpdate(data);
        expect(data.dueDate).toBeInstanceOf(Date);
        expect(isNaN(data.dueDate.getTime())).toBe(false);
    });

    test("throws for an invalid date string", () => {
        expectAppError(() => ItemValidator.validateUpdate({ dueDate: "banana" }));
    });

    test("allows null dueDate without throwing", () => {
        expect(() => ItemValidator.validateUpdate({ dueDate: null })).not.toThrow();
    });

    test("allows empty string dueDate without throwing", () => {
        expect(() => ItemValidator.validateUpdate({ dueDate: "" })).not.toThrow();
    });

    // ── phoneNumber ────────────────────────────────────────────────────

    test("throws for an 11-digit phoneNumber on update", () => {
        expectAppError(() =>
            ItemValidator.validateUpdate({ phoneNumber: "12345678901" })
        );
    });

    test("accepts a valid 10-digit phoneNumber on update", () => {
        expect(() =>
            ItemValidator.validateUpdate({ phoneNumber: "9876543210" })
        ).not.toThrow();
    });

    // ── Length limits ─────────────────────────────────────────────────

    test("throws when updated customerName exceeds 100 characters", () => {
        expectAppError(() =>
            ItemValidator.validateUpdate({ customerName: "A".repeat(101) })
        );
    });

    test("throws when updated repairNotes exceeds 2000 characters", () => {
        expectAppError(() =>
            ItemValidator.validateUpdate({ repairNotes: "x".repeat(2001) })
        );
    });
});
