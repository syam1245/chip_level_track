/**
 * items.service.test.js
 *
 * Unit tests for the ItemService orchestration layer.
 * All external dependencies (ItemRepository, domain functions, eventBus)
 * are mocked so these tests never touch a real database.
 */

import { jest } from "@jest/globals";

// ── Mock all external dependencies ────────────────────────────────────────────

// ItemRepository
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

// computeAgingSummary
const mockAgingSummary = { attention: 1, overdue: 2, critical: 0, total: 3 };
jest.unstable_mockModule("../../modules/items/items.aging.js", () => ({
    enrichWithAging:     jest.fn(),
    computeAgingSummary: jest.fn().mockResolvedValue(mockAgingSummary),
    CLOSED_STATUSES:     new Set(["Delivered", "Return"]),
    ACTIVE_STATUSES:     [],
}));

// EventBus
const mockEmit = jest.fn();
import { EVENTS } from "../../core/events/eventBus.js";
jest.unstable_mockModule("../../core/events/eventBus.js", () => ({
    eventBus: { emit: mockEmit },
    EVENTS,
}));

// ── Domain mocks ──────────────────────────────────────────────────────────────

const mockBuildNewJobData = jest.fn((data, user) => ({
    ...data,
    status: data.status || "Received",
    technicianName: user.displayName,
    statusHistory: [{
        status: data.status || "Received",
        note: data.repairNotes || "Job Created",
        changedAt: new Date(),
    }],
}));

const mockApplyFieldUpdates = jest.fn();
const mockApplyStatusChange = jest.fn().mockReturnValue({ changed: false, revenueRealized: false });

jest.unstable_mockModule("../../modules/items/domain/job.domain.js", () => ({
    buildNewJobData:   mockBuildNewJobData,
    applyFieldUpdates: mockApplyFieldUpdates,
    applyStatusChange: mockApplyStatusChange,
}));

jest.unstable_mockModule("../../modules/items/domain/jobStatus.domain.js", () => ({
    STATUS_GROUPS: {
        inProgress: ["Received", "In Progress", "Waiting for Parts", "Sent to Service", "Pending"],
        ready:      ["Ready", "Delivered"],
        returned:   ["Return"],
    },
}));

jest.unstable_mockModule("../../modules/items/domain/technician.domain.js", () => ({
    buildTechnicianFilter: jest.fn().mockReturnValue(null),
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

    mockRepo.aggregate.mockResolvedValue(makeFacetResult());
    mockRepo.findAll.mockResolvedValue([]);
    mockRepo.countDocuments.mockResolvedValue(0);
    mockApplyStatusChange.mockReturnValue({ changed: false, revenueRealized: false });
});

// ═════════════════════════════════════════════════════════════════════════════
// _getStatCounts
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService._getStatCounts", () => {
    test("calls aggregate exactly once", async () => {
        mockRepo.aggregate.mockResolvedValue(makeFacetResult(10, 5, 3));
        const stats = await ItemService._getStatCounts();
        expect(mockRepo.aggregate).toHaveBeenCalledTimes(1);
        expect(stats).toEqual({ inProgress: 10, ready: 5, returned: 3 });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// getItems
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService.getItems", () => {
    const BASE_PARAMS = {
        page: 1, limit: 10, search: "", statusGroup: "", technicianName: "All",
        userRole: "user", includeMetadata: "false", sortBy: "createdAt", sortOrder: "desc",
    };

    test("returns stats with the shape the frontend expects", async () => {
        mockRepo.aggregate.mockResolvedValue(makeFacetResult(7, 2, 1));
        const { stats } = await ItemService.getItems(BASE_PARAMS);
        expect(stats).toMatchObject({ total: 10, inProgress: 7, ready: 2, returned: 1, agingSummary: mockAgingSummary });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// createItem
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService.createItem", () => {
    const user = { displayName: "Bob" };
    const validData = { jobNumber: "JOB999", customerName: "Alice" };

    test("emits JOB_CREATED event after a successful write", async () => {
        mockRepo.findByJobNumber.mockResolvedValue(null);
        mockRepo.create.mockResolvedValue(makeDoc({ jobNumber: "JOB999" }));

        await ItemService.createItem(validData, user);

        expect(mockEmit).toHaveBeenCalledWith(EVENTS.JOB_CREATED, expect.objectContaining({
            jobNumber: "JOB999",
        }));
    });

    test("does NOT emit event if create throws", async () => {
        mockRepo.findByJobNumber.mockResolvedValue(null);
        mockRepo.create.mockRejectedValue(new Error("DB write failed"));

        await expect(ItemService.createItem(validData, user)).rejects.toThrow();
        expect(mockEmit).not.toHaveBeenCalled();
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// updateItem
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService.updateItem", () => {
    test("emits JOB_UPDATED event after every save", async () => {
        const doc = makeDoc();
        mockRepo.findById.mockResolvedValue(doc);

        await ItemService.updateItem("id", { brand: "Nokia" });

        expect(mockEmit).toHaveBeenCalledWith(EVENTS.JOB_UPDATED, { id: "id" });
        expect(mockEmit).not.toHaveBeenCalledWith(EVENTS.JOB_STATUS_CHANGED, expect.anything());
    });

    test("emits JOB_STATUS_CHANGED if domain layer indicates a status change", async () => {
        const doc = makeDoc({ status: "Received", jobNumber: "J1" });
        mockRepo.findById.mockResolvedValue(doc);
        
        // Mock the domain side-effect returns
        mockApplyStatusChange.mockImplementation((item) => {
            item.status = "In Progress";
            return { changed: true, revenueRealized: false };
        });

        await ItemService.updateItem("id", { status: "In Progress" });

        expect(mockEmit).toHaveBeenCalledWith(EVENTS.JOB_STATUS_CHANGED, {
            id: "id",
            jobNumber: "J1",
            newStatus: "In Progress" // Using the updated status
        });
    });

    test("emits JOB_REVENUE_REALIZED if domain layer flags it", async () => {
        const revDate = new Date();
        const doc = makeDoc({ status: "In Progress", revenueRealizedAt: revDate });
        mockRepo.findById.mockResolvedValue(doc);
        
        mockApplyStatusChange.mockReturnValue({ changed: true, revenueRealized: true });

        await ItemService.updateItem("id", { status: "Ready" });

        expect(mockEmit).toHaveBeenCalledWith(EVENTS.JOB_REVENUE_REALIZED, { date: revDate });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// deleteItem
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService.deleteItem", () => {
    test("soft-deletes the item and emits JOB_DELETED", async () => {
        mockRepo.findById.mockResolvedValue(makeDoc());
        mockRepo.softDelete.mockResolvedValue({ isDeleted: true });

        await ItemService.deleteItem("some-id");

        expect(mockEmit).toHaveBeenCalledWith(EVENTS.JOB_DELETED, { id: "some-id" });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// bulkUpdateStatus
// ═════════════════════════════════════════════════════════════════════════════

describe("ItemService.bulkUpdateStatus", () => {
    test("emits multiple events on bulk Ready transition", async () => {
        mockRepo.bulkUpdateStatus.mockResolvedValue({ modifiedCount: 2 });
        mockRepo.bulkSetRevenueRealized.mockResolvedValue({});
        mockRepo.bulkSetDueDateIfNull.mockResolvedValue({});

        await ItemService.bulkUpdateStatus(["id1", "id2"], "Ready");

        expect(mockEmit).toHaveBeenCalledWith(EVENTS.JOB_REVENUE_REALIZED, expect.objectContaining({ date: expect.any(Date) }));
        expect(mockEmit).toHaveBeenCalledWith(EVENTS.JOB_BULK_UPDATED, { count: 2, status: "Ready" });
    });
});
