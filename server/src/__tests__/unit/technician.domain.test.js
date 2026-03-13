/**
 * technician.domain.test.js
 *
 * Pure unit tests for technician name normalization and query building.
 * No mocks needed — these are pure functions.
 */

import {
    normalizeTechnicianName,
    buildTechnicianFilter,
} from "../../modules/items/domain/technician.domain.js";

// ═════════════════════════════════════════════════════════════════════════════
// normalizeTechnicianName
// ═════════════════════════════════════════════════════════════════════════════

describe("normalizeTechnicianName", () => {

    test("strips ' (Admin)' suffix", () => {
        expect(normalizeTechnicianName("Shyam (Admin)")).toBe("Shyam");
    });

    test("strips ' (admin)' suffix (case-insensitive)", () => {
        expect(normalizeTechnicianName("Shyam (admin)")).toBe("Shyam");
    });

    test("strips ' (ADMIN)' suffix (case-insensitive)", () => {
        expect(normalizeTechnicianName("Shyam (ADMIN)")).toBe("Shyam");
    });

    test("handles extra spaces before suffix", () => {
        expect(normalizeTechnicianName("Shyam  (Admin)")).toBe("Shyam");
    });

    test("returns name unchanged when no suffix", () => {
        expect(normalizeTechnicianName("Bob")).toBe("Bob");
    });

    test("returns empty string for empty input", () => {
        expect(normalizeTechnicianName("")).toBe("");
    });

    test("returns null for null input", () => {
        expect(normalizeTechnicianName(null)).toBe(null);
    });

    test("returns undefined for undefined input", () => {
        expect(normalizeTechnicianName(undefined)).toBe(undefined);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// buildTechnicianFilter
// ═════════════════════════════════════════════════════════════════════════════

describe("buildTechnicianFilter", () => {

    test("returns null for 'All'", () => {
        expect(buildTechnicianFilter("All")).toBeNull();
    });

    test("returns null for empty string", () => {
        expect(buildTechnicianFilter("")).toBeNull();
    });

    test("returns null for null", () => {
        expect(buildTechnicianFilter(null)).toBeNull();
    });

    test("returns $in array for name with (Admin) suffix", () => {
        const result = buildTechnicianFilter("Shyam (Admin)");
        expect(result).toEqual({ $in: ["Shyam (Admin)", "Shyam"] });
    });

    test("returns plain string for name without suffix", () => {
        const result = buildTechnicianFilter("Bob");
        expect(result).toBe("Bob");
    });
});
