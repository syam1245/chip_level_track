/**
 * items.aging.test.js
 *
 * Pure unit tests for the aging utilities.
 * enrichWithAging and getAgingTier are pure functions — no DB, no mocks.
 * computeAgingSummary is tested with a mocked repository.
 */

import { jest } from "@jest/globals";

// ── Mock ItemRepository for computeAgingSummary ───────────────────────────────

const mockAggregate        = jest.fn();
const mockCountDocuments   = jest.fn();

jest.unstable_mockModule("../../modules/items/items.repository.js", () => ({
    default: {
        aggregate:       mockAggregate,
        countDocuments:  mockCountDocuments,
    },
}));

const {
    enrichWithAging,
    getAgingTier,
    computeAgingSummary,
    CLOSED_STATUSES,
    ACTIVE_STATUSES,
} = await import("../../modules/items/items.aging.js");

beforeEach(() => jest.clearAllMocks());

// ═════════════════════════════════════════════════════════════════════════════
// getAgingTier
// ═════════════════════════════════════════════════════════════════════════════

describe("getAgingTier", () => {

    test.each([
        [0,  "fresh"],
        [1,  "fresh"],
        [3,  "fresh"],
        [4,  "normal"],
        [5,  "normal"],
        [6,  "attention"],
        [7,  "attention"],
        [8,  "overdue"],
        [14, "overdue"],
        [15, "critical"],
        [30, "critical"],
        [999,"critical"],
    ])("%d days → %s", (days, expected) => {
        expect(getAgingTier(days)).toBe(expected);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// enrichWithAging
// ═════════════════════════════════════════════════════════════════════════════

describe("enrichWithAging", () => {

    const MS_PER_DAY = 86_400_000;

    function itemCreatedDaysAgo(days, status = "Received") {
        return {
            status,
            createdAt: new Date(Date.now() - days * MS_PER_DAY),
        };
    }

    test("sets agingTier to 'closed' for Delivered items regardless of age", () => {
        const item = itemCreatedDaysAgo(30, "Delivered");
        enrichWithAging(item, Date.now());
        expect(item.agingTier).toBe("closed");
        expect(item.ageDays).toBe(0);
    });

    test("sets agingTier to 'closed' for Return items regardless of age", () => {
        const item = itemCreatedDaysAgo(30, "Return");
        enrichWithAging(item, Date.now());
        expect(item.agingTier).toBe("closed");
    });

    test("computes ageDays correctly for an active item", () => {
        const item = itemCreatedDaysAgo(10, "In Progress");
        enrichWithAging(item, Date.now());
        expect(item.ageDays).toBe(10);
    });

    test("assigns 'critical' tier to an active item created 20 days ago", () => {
        const item = itemCreatedDaysAgo(20, "In Progress");
        enrichWithAging(item, Date.now());
        expect(item.agingTier).toBe("critical");
    });

    test("assigns 'fresh' tier to an item created today", () => {
        const item = itemCreatedDaysAgo(0, "Received");
        enrichWithAging(item, Date.now());
        expect(item.agingTier).toBe("fresh");
        expect(item.ageDays).toBe(0);
    });

    test("never sets ageDays below 0 (defensive clamp)", () => {
        // Item with a createdAt slightly in the future (clock skew)
        const item = { status: "Received", createdAt: new Date(Date.now() + 60_000) };
        enrichWithAging(item, Date.now());
        expect(item.ageDays).toBe(0);
    });

    test("mutates the item in place and also returns it", () => {
        const item = itemCreatedDaysAgo(3, "Ready");
        const returned = enrichWithAging(item, Date.now());
        expect(returned).toBe(item);
        expect(item).toHaveProperty("ageDays");
        expect(item).toHaveProperty("agingTier");
    });

    test("all ACTIVE_STATUSES get a numeric ageDays (not 0/closed)", () => {
        const now = Date.now();
        for (const status of ACTIVE_STATUSES) {
            const item = { status, createdAt: new Date(now - 5 * MS_PER_DAY) };
            enrichWithAging(item, now);
            expect(item.agingTier).not.toBe("closed");
            expect(item.ageDays).toBe(5);
        }
    });

    test("all CLOSED_STATUSES get agingTier 'closed'", () => {
        const now = Date.now();
        for (const status of CLOSED_STATUSES) {
            const item = { status, createdAt: new Date(now - 10 * MS_PER_DAY) };
            enrichWithAging(item, now);
            expect(item.agingTier).toBe("closed");
        }
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// computeAgingSummary
// ═════════════════════════════════════════════════════════════════════════════

describe("computeAgingSummary", () => {

    test("returns correct counts from a successful $dateDiff aggregation", async () => {
        mockAggregate.mockResolvedValue([
            { attention: 3, overdue: 5, critical: 2 },
        ]);

        const summary = await computeAgingSummary();

        expect(summary).toEqual({ attention: 3, overdue: 5, critical: 2, total: 10 });
    });

    test("total = attention + overdue + critical", async () => {
        mockAggregate.mockResolvedValue([{ attention: 1, overdue: 2, critical: 7 }]);

        const summary = await computeAgingSummary();
        expect(summary.total).toBe(10);
    });

    test("handles empty aggregation result (no active jobs)", async () => {
        mockAggregate.mockResolvedValue([]);

        const summary = await computeAgingSummary();
        expect(summary).toEqual({ attention: 0, overdue: 0, critical: 0, total: 0 });
    });

    test("falls back to countDocuments when $dateDiff aggregation throws", async () => {
        // Simulate MongoDB < 5.0 — $dateDiff not available
        mockAggregate.mockRejectedValue(new Error("Unrecognized expression '$dateDiff'"));
        mockCountDocuments
            .mockResolvedValueOnce(4)   // attention
            .mockResolvedValueOnce(6)   // overdue
            .mockResolvedValueOnce(1);  // critical

        const summary = await computeAgingSummary();

        expect(mockCountDocuments).toHaveBeenCalledTimes(3);
        expect(summary).toEqual({ attention: 4, overdue: 6, critical: 1, total: 11 });
    });

    test("fallback also returns correct total", async () => {
        mockAggregate.mockRejectedValue(new Error("$dateDiff unavailable"));
        mockCountDocuments
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(3)
            .mockResolvedValueOnce(5);

        const summary = await computeAgingSummary();
        expect(summary.total).toBe(10);
    });
});
