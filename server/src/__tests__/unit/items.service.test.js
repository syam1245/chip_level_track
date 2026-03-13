/**
 * items.service.test.js
 *
 * Unit tests for the ItemService business-logic layer.
 * All external dependencies (ItemRepository, broadcast, StatsService) are
 * mocked so these tests never touch a real database.
 *
 * Mocking strategy: jest.unstable_mockModule() must be called BEFORE the
 * module under test is imported (required for Jest + native ES modules).
 */

import { jest } from "@jest/globals";

// ── Mock all external dependencies ────────────────────────────────────────────

// ItemRepository — every method returns sensible defaults that tests can override
const mockRepo = {
    findAll:              jest.fn(),
    countDocuments:       jest.fn(),
    aggregate:            jest.fn(),
    findById:             jest.fn(),
    findByJobNumber:      jest.fn(),
    create:               jest.fn(),
    softDelete:           jest.fn(),
    bulkSoftDelete:       jest.fn(),
    bulkUpdateStatus:     jest.fn(),
    bulkSetRevenueRealized: jest.fn(),
    bulkSetDueDateIfNull: jest.fn(),
    findByTrackingDetails: jest.fn(),
    findAllForBackup:     jest.fn(),
};

jest.unstable_mockModule("../../modules/items/items.repository.js", () => ({
    default: mockRepo,
}));

// broadcast — we only care that it was called with the right event
const mockBroadcast = jest.fn();
jest.unstable_mockModule("../../modules/items/items.events.js", () => ({
    broadcast: mockBroadcast,
}));

// computeAgingSummary — always returns a fixed summary
const mockAgingSummary = { attention: 1, overdue: 2, critical: 0, total: 3 };
jest.unstable_mockModule("../../modules/items/items.aging.js", () => ({
    enrichWithAging:     jest.fn(),
    computeAgingSummary: jest.fn().mockResolvedValue(mockAgingSummary),
    CLOSED_STATUSES:     new Set(["Delivered", "Return"]),
    ACTIVE_STATUSES:     [],
}));

// StatsService.invalidateRevenueCache
const mockInvalidateRevenue = jest.fn();
jest.unstable_mockModule("../../modules/stats/stats.service.js", () => ({
    default: { invalidateRevenueCache: mockInvalidateRevenue },
}));

// ── Import the module under test AFTER all mocks are registered ───────────────
const { default: ItemService } = await import("../../modules/items/items.service.js");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDoc(overrides = {}) {
    const doc = {
        _id:               "aabbccddeeff001122334455",
        jobNumber:         "JOB001",
        customerName:      "Alice",
        brand:             "Samsung",
        phoneNumber:       "9876543210",
        status:            "Received",
        repairNotes:       "",
        issue:             "Screen crack",
        finalCost:         0,
        statusHistory:     [],
        isDeleted:         false,
        technicianName:    "Bob",
        dueDate:           null,
        deliveredAt:       null,
        revenueRealizedAt: null,
        createdAt:         new Date("2025-01-01T00:00:00Z"),
        ...overrides,
    };
    // save resolves to the doc itself unless overridden
    doc.save = overrides.save ?? jest.fn().mockResolvedValue(doc);
    return doc;
}

function makeFacetResult(inProgress = 5, ready = 3, returned = 2) {
    return [{
        inProgress: [{ n: inProgress }],
        ready:      [{ n: ready }],
        returned:   [{ n: returned }],
    }];
}

// ── Reset mocks between tests ─────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    ItemService._invalidateCache();

    // Sensible defaults so "happy path" tests don't need to set these up
    mockRepo.aggregate.mockResolvedValue(makeFacetResult());
    mockRepo.findAll.mockResolvedValue([]);
    mockRepo.countDocuments.mockResolvedValue(0);
});

// ═════════════════════════════════════════════════════════════════════════════
// _getStatCounts — single $facet aggregation
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService._getStatCounts", () => {

    test("calls aggregate exactly once (not three countDocuments)", async () => {
        mockRepo.aggregate.mockResolvedValue(makeFacetResult(10, 5, 3));

        const stats = await ItemService._getStatCounts();

        expect(mockRepo.aggregate).toHaveBeenCalledTimes(1);
        expect(mockRepo.countDocuments).not.toHaveBeenCalled();

        expect(stats).toEqual({ inProgress: 10, ready: 5, returned: 3 });
    });

    test("the $facet stage filters by isDeleted: false at the $match level", async () => {
        await ItemService._getStatCounts();

        const [pipeline] = mockRepo.aggregate.mock.calls[0];
        const matchStage = pipeline.find((s) => s.$match);
        expect(matchStage.$match.isDeleted).toBe(false);
    });

    test("caches the result — second call does not hit the DB", async () => {
        mockRepo.aggregate.mockResolvedValue(makeFacetResult(4, 2, 1));

        // First call — cold cache
        await ItemService._getStatCounts();
        // Second call — should be served from cache
        await ItemService._getStatCounts();

        expect(mockRepo.aggregate).toHaveBeenCalledTimes(1);
    });

    test("handles empty facet buckets (no documents in a group)", async () => {
        mockRepo.aggregate.mockResolvedValue([{
            inProgress: [],
            ready:      [],
            returned:   [],
        }]);

        const stats = await ItemService._getStatCounts();
        expect(stats).toEqual({ inProgress: 0, ready: 0, returned: 0 });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// getItems — stat derivation + filtered total
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService.getItems", () => {

    const BASE_PARAMS = {
        page: 1, limit: 10,
        search: "", statusGroup: "", technicianName: "All",
        userRole: "user", includeMetadata: "false",
        sortBy: "createdAt", sortOrder: "desc",
    };

    test("total is derived from stat counts — no extra countDocuments call", async () => {
        mockRepo.aggregate.mockResolvedValue(makeFacetResult(5, 3, 2));
        mockRepo.findAll.mockResolvedValue([]);

        const result = await ItemService.getItems(BASE_PARAMS);

        // total = 5 + 3 + 2 = 10, and countDocuments should NOT have been called
        // for the unfiltered total (it may still be called for the filteredTotal
        // path, but not here because no filters are active)
        expect(result.stats.total).toBe(10);
        expect(mockRepo.countDocuments).not.toHaveBeenCalled();
    });

    test("runs filteredTotal countDocuments only when a filter is active", async () => {
        mockRepo.aggregate.mockResolvedValue(makeFacetResult(5, 3, 2));
        mockRepo.findAll.mockResolvedValue([]);
        mockRepo.countDocuments.mockResolvedValue(3);

        const result = await ItemService.getItems({ ...BASE_PARAMS, search: "samsung" });

        // With search active, a filtered countDocuments should run
        expect(mockRepo.countDocuments).toHaveBeenCalledTimes(1);
        expect(result.totalItems).toBe(3);
    });

    test("returns stats with the shape the frontend expects", async () => {
        mockRepo.aggregate.mockResolvedValue(makeFacetResult(7, 2, 1));

        const { stats } = await ItemService.getItems(BASE_PARAMS);

        expect(stats).toMatchObject({
            total:        10,
            inProgress:   7,
            ready:        2,
            returned:     1,
            agingSummary: mockAgingSummary,
        });
    });

    test("calculates correct totalPages", async () => {
        mockRepo.aggregate.mockResolvedValue(makeFacetResult(15, 5, 5));
        mockRepo.findAll.mockResolvedValue([]);

        const result = await ItemService.getItems({ ...BASE_PARAMS, limit: 10 });

        // total = 25, limit = 10 → 3 pages
        expect(result.totalPages).toBe(3);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// createItem
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService.createItem", () => {

    const user = { displayName: "Bob" };

    const validData = {
        jobNumber:    "JOB999",
        customerName: "Alice",
        brand:        "Apple",
        phoneNumber:  "9876543210",
    };

    test("throws 400 when job number already exists", async () => {
        mockRepo.findByJobNumber.mockResolvedValue(makeDoc());

        await expect(ItemService.createItem(validData, user))
            .rejects.toMatchObject({ statusCode: 400, message: /already exists/i });
    });

    test("creates item and assigns technicianName from user.displayName", async () => {
        mockRepo.findByJobNumber.mockResolvedValue(null);
        const created = makeDoc();
        mockRepo.create.mockResolvedValue(created);

        await ItemService.createItem(validData, user);

        const [savedData] = mockRepo.create.mock.calls[0];
        expect(savedData.technicianName).toBe("Bob");
    });

    test("seeds statusHistory with the initial status", async () => {
        mockRepo.findByJobNumber.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(makeDoc());

        await ItemService.createItem({ ...validData, status: "In Progress" }, user);

        const [savedData] = mockRepo.create.mock.calls[0];
        expect(savedData.statusHistory).toHaveLength(1);
        expect(savedData.statusHistory[0].status).toBe("In Progress");
    });

    test("defaults status to 'Received' when none provided", async () => {
        mockRepo.findByJobNumber.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(makeDoc());

        await ItemService.createItem(validData, user);

        const [savedData] = mockRepo.create.mock.calls[0];
        expect(savedData.status).toBe("Received");
    });

    test("broadcasts job:created after a successful write", async () => {
        mockRepo.findByJobNumber.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(makeDoc({ jobNumber: "JOB999" }));

        await ItemService.createItem(validData, user);

        expect(mockBroadcast).toHaveBeenCalledWith("job:created", expect.objectContaining({
            jobNumber: "JOB999",
        }));
    });

    test("does NOT broadcast or invalidate cache if create throws", async () => {
        mockRepo.findByJobNumber.mockResolvedValue(null);
        mockRepo.create.mockRejectedValue(new Error("DB write failed"));

        await expect(ItemService.createItem(validData, user)).rejects.toThrow();
        expect(mockBroadcast).not.toHaveBeenCalled();
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// updateItem — status transition rules
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService.updateItem — status transitions", () => {

    test("throws 404 when item is not found", async () => {
        mockRepo.findById.mockResolvedValue(null);

        await expect(ItemService.updateItem("nonexistent-id", { status: "Ready" }))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test("throws when setting status to an invalid value", async () => {
        mockRepo.findById.mockResolvedValue(makeDoc());

        await expect(ItemService.updateItem("id", { status: "Banana" }))
            .rejects.toMatchObject({ statusCode: 400, message: /Invalid status/ });
    });

    test("throws when marking Delivered without a finalCost", async () => {
        mockRepo.findById.mockResolvedValue(makeDoc({ finalCost: 0 }));

        await expect(ItemService.updateItem("id", { status: "Delivered" }))
            .rejects.toMatchObject({ statusCode: 400, message: /final amount/ });
    });

    test("allows Delivered when finalCost is already set on the item", async () => {
        const doc = makeDoc({ finalCost: 500 });
        mockRepo.findById.mockResolvedValue(doc);

        await ItemService.updateItem("id", { status: "Delivered" });

        expect(doc.save).toHaveBeenCalled();
    });

    test("pushes to statusHistory on every status change", async () => {
        const doc = makeDoc({ status: "Received" });
        mockRepo.findById.mockResolvedValue(doc);

        await ItemService.updateItem("id", { status: "In Progress" });

        expect(doc.statusHistory).toHaveLength(1);
        expect(doc.statusHistory[0].status).toBe("In Progress");
    });

    test("does NOT push to statusHistory when status is unchanged", async () => {
        const doc = makeDoc({ status: "Ready" });
        mockRepo.findById.mockResolvedValue(doc);

        await ItemService.updateItem("id", { status: "Ready", brand: "Xiaomi" });

        expect(doc.statusHistory).toHaveLength(0);
    });

    // ── Ready ─────────────────────────────────────────────────────────

    test("sets dueDate when transitioning to Ready and dueDate is null", async () => {
        const doc = makeDoc({ status: "In Progress", dueDate: null });
        mockRepo.findById.mockResolvedValue(doc);

        await ItemService.updateItem("id", { status: "Ready" });

        expect(doc.dueDate).toBeInstanceOf(Date);
    });

    test("does NOT overwrite an existing dueDate on Ready transition", async () => {
        const existingDue = new Date("2025-06-01");
        const doc = makeDoc({ status: "In Progress", dueDate: existingDue });
        mockRepo.findById.mockResolvedValue(doc);

        await ItemService.updateItem("id", { status: "Ready" });

        expect(doc.dueDate).toEqual(existingDue);
    });

    test("sets revenueRealizedAt on first Ready transition", async () => {
        const doc = makeDoc({ status: "In Progress", revenueRealizedAt: null });
        mockRepo.findById.mockResolvedValue(doc);

        await ItemService.updateItem("id", { status: "Ready" });

        expect(doc.revenueRealizedAt).toBeInstanceOf(Date);
        expect(mockInvalidateRevenue).toHaveBeenCalledTimes(1);
    });

    test("does NOT overwrite revenueRealizedAt on repeated Ready transitions", async () => {
        const originalDate = new Date("2025-03-01");
        const doc = makeDoc({ status: "In Progress", revenueRealizedAt: originalDate });
        mockRepo.findById.mockResolvedValue(doc);

        await ItemService.updateItem("id", { status: "Ready" });

        expect(doc.revenueRealizedAt).toEqual(originalDate);
        // invalidateRevenueCache should NOT be called if revenueRealizedAt was already set
        expect(mockInvalidateRevenue).not.toHaveBeenCalled();
    });

    // ── Delivered ─────────────────────────────────────────────────────

    test("sets deliveredAt on Delivered transition", async () => {
        const doc = makeDoc({ status: "Ready", finalCost: 1200 });
        mockRepo.findById.mockResolvedValue(doc);

        await ItemService.updateItem("id", { status: "Delivered" });

        expect(doc.deliveredAt).toBeInstanceOf(Date);
    });

    test("sets revenueRealizedAt on Delivered transition when not already set", async () => {
        const doc = makeDoc({ status: "Ready", finalCost: 1200, revenueRealizedAt: null });
        mockRepo.findById.mockResolvedValue(doc);

        await ItemService.updateItem("id", { status: "Delivered" });

        expect(doc.revenueRealizedAt).toBeInstanceOf(Date);
        expect(mockInvalidateRevenue).toHaveBeenCalledTimes(1);
    });

    test("broadcasts job:updated after every save", async () => {
        const doc = makeDoc();
        mockRepo.findById.mockResolvedValue(doc);

        await ItemService.updateItem("id", { brand: "Nokia" });

        expect(mockBroadcast).toHaveBeenCalledWith("job:updated", { id: "id" });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// deleteItem
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService.deleteItem", () => {

    test("throws 404 when item is not found", async () => {
        mockRepo.findById.mockResolvedValue(null);

        await expect(ItemService.deleteItem("missing-id"))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test("soft-deletes the item and broadcasts job:deleted", async () => {
        mockRepo.findById.mockResolvedValue(makeDoc());
        mockRepo.softDelete.mockResolvedValue({ isDeleted: true });

        await ItemService.deleteItem("some-id");

        expect(mockRepo.softDelete).toHaveBeenCalledWith("some-id");
        expect(mockBroadcast).toHaveBeenCalledWith("job:deleted", { id: "some-id" });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// bulkUpdateStatus
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService.bulkUpdateStatus", () => {

    test("throws when ids array is empty", async () => {
        await expect(ItemService.bulkUpdateStatus([], "Ready"))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test("throws when ids is not an array", async () => {
        await expect(ItemService.bulkUpdateStatus("id-string", "Ready"))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test("throws when status is invalid", async () => {
        await expect(ItemService.bulkUpdateStatus(["id1"], "LaunchRocket"))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test("throws when trying to bulk-update to Delivered", async () => {
        await expect(ItemService.bulkUpdateStatus(["id1", "id2"], "Delivered"))
            .rejects.toMatchObject({ statusCode: 400, message: /Delivered/ });
    });

    test("runs bulkSetRevenueRealized and bulkSetDueDateIfNull in parallel on Ready", async () => {
        mockRepo.bulkUpdateStatus.mockResolvedValue({ modifiedCount: 2 });
        mockRepo.bulkSetRevenueRealized.mockResolvedValue({});
        mockRepo.bulkSetDueDateIfNull.mockResolvedValue({});

        await ItemService.bulkUpdateStatus(["id1", "id2"], "Ready");

        expect(mockRepo.bulkSetRevenueRealized).toHaveBeenCalledWith(["id1", "id2"]);
        expect(mockRepo.bulkSetDueDateIfNull).toHaveBeenCalledWith(["id1", "id2"]);
        expect(mockInvalidateRevenue).toHaveBeenCalledTimes(1);
    });

    test("does NOT call revenue helpers for non-Ready statuses", async () => {
        mockRepo.bulkUpdateStatus.mockResolvedValue({ modifiedCount: 1 });

        await ItemService.bulkUpdateStatus(["id1"], "In Progress");

        expect(mockRepo.bulkSetRevenueRealized).not.toHaveBeenCalled();
        expect(mockInvalidateRevenue).not.toHaveBeenCalled();
    });

    test("broadcasts job:bulk-updated with correct count", async () => {
        mockRepo.bulkUpdateStatus.mockResolvedValue({ modifiedCount: 3 });

        await ItemService.bulkUpdateStatus(["a", "b", "c"], "In Progress");

        expect(mockBroadcast).toHaveBeenCalledWith("job:bulk-updated", {
            count: 3, status: "In Progress",
        });
    });
});
