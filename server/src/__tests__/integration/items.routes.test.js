/**
 * items.routes.test.js — Integration tests
 *
 * Spins up the real Express app against an in-memory MongoDB instance.
 * Every request goes through the full middleware stack:
 *   security → attachAuth → requireAuth → requireCsrf → requirePermission → service → repository
 *
 * Prerequisites:
 *   npm install --save-dev mongodb-memory-server
 *
 * What is tested here (NOT in unit tests):
 *   - HTTP status codes and response shapes
 *   - Route-level auth / CSRF / permission enforcement end-to-end
 *   - Real DB writes + reads (status transitions, pagination)
 *   - Public /track endpoint
 */

import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Set env vars before any app modules load
process.env.AUTH_TOKEN_SECRET = "integration-test-secret-32chars!!";
process.env.JWT_SECRET         = "integration-test-secret-32chars!!";
process.env.NODE_ENV           = "test";
process.env.CORS_ORIGIN        = "http://localhost:3000";

const { startDb, stopDb, clearDb } = await import("../helpers/testDb.js");
const { default: app } = await import("../../app.js");
const { default: Item } = await import("../../modules/items/models/item.model.js");
const { default: User } = await import("../../modules/auth/models/user.model.js");
import bcrypt from "bcryptjs";

// ── Auth helpers ──────────────────────────────────────────────────────────────

function makeToken(overrides = {}) {
    const csrfToken = crypto.randomBytes(24).toString("hex");
    const payload   = {
        username:    "testadmin",
        role:        "admin",
        displayName: "Test Admin",
        csrfToken,
        ...overrides,
    };
    const token = jwt.sign(payload, process.env.AUTH_TOKEN_SECRET, { expiresIn: "12h" });
    return { token, csrfToken };
}

function authHeaders(token, csrfToken) {
    return {
        Cookie:         `chip_auth=${token}; chip_csrf=${csrfToken}`,
        "x-csrf-token": csrfToken,
    };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

let jobCounter = 9000;
function nextJob() { return `IT-TEST-${++jobCounter}`; }

async function createItem(overrides = {}) {
    return await Item.create({
        jobNumber:     nextJob(),
        customerName:  "INTEGRATION TEST",
        brand:         "TestBrand",
        phoneNumber:   "9000000001",
        status:        "Received",
        statusHistory: [{ status: "Received", note: "Created", changedAt: new Date() }],
        technicianName:"Test Admin",
        isDeleted:     false,
        ...overrides,
    });
}

const { default: ItemService } = await import("../../modules/items/items.service.js");

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(startDb);
afterEach(async () => {
    await clearDb();
    ItemService._invalidateCache();
});
afterAll(stopDb);

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/items — list + pagination
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/items", () => {

    test("returns 401 with no auth cookie", async () => {
        const res = await request(app).get("/api/items");
        expect(res.status).toBe(401);
    });

    test("returns 200 with valid auth — empty result set", async () => {
        const { token, csrfToken } = makeToken();

        const res = await request(app)
            .get("/api/items")
            .set(authHeaders(token, csrfToken));

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("items");
        expect(res.body.data).toHaveProperty("totalPages");
        expect(res.body.data).toHaveProperty("stats");
        expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    test("returns correct stats.total count", async () => {
        await createItem({ status: "Received" });
        await createItem({ status: "Ready" });

        const { token, csrfToken } = makeToken();
        const res = await request(app)
            .get("/api/items?statusGroup=all")
            .set(authHeaders(token, csrfToken));

        expect(res.status).toBe(200);
        // total = sum of all status groups
        expect(res.body.data.stats.total).toBe(2);
    });

    test("filters by statusGroup", async () => {
        await createItem({ status: "Ready",    statusHistory: [{ status: "Ready",    changedAt: new Date() }] });
        await createItem({ status: "Received", statusHistory: [{ status: "Received", changedAt: new Date() }] });

        const { token, csrfToken } = makeToken();
        const res = await request(app)
            .get("/api/items?statusGroup=ready")
            .set(authHeaders(token, csrfToken));

        expect(res.status).toBe(200);
        expect(res.body.data.items.every((i) => i.status === "Ready" || i.status === "Delivered")).toBe(true);
    });

    test("paginates correctly", async () => {
        await Promise.all(Array.from({ length: 15 }, () => createItem()));

        const { token, csrfToken } = makeToken();
        const res = await request(app)
            .get("/api/items?page=1&limit=10&statusGroup=inProgress")
            .set(authHeaders(token, csrfToken));

        expect(res.status).toBe(200);
        expect(res.body.data.items).toHaveLength(10);
        expect(res.body.data.totalPages).toBeGreaterThan(1);
    });

    test("excludes soft-deleted items", async () => {
        await createItem({ isDeleted: true });
        await createItem({ isDeleted: false });

        const { token, csrfToken } = makeToken();
        const res = await request(app)
            .get("/api/items?statusGroup=inProgress")
            .set(authHeaders(token, csrfToken));

        expect(res.body.data.items.every((i) => !i.isDeleted)).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/items — create
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/items", () => {

    function validPayload(overrides = {}) {
        return {
            jobNumber:    nextJob(),
            customerName: "John Test",
            brand:        "Nokia",
            phoneNumber:  "9123456789",
            issue:        "Charging port broken",
            ...overrides,
        };
    }

    test("returns 401 with no auth", async () => {
        const res = await request(app).post("/api/items").send(validPayload());
        expect(res.status).toBe(401);
    });

    test("returns 403 with auth but no CSRF token", async () => {
        const { token } = makeToken();
        const res = await request(app)
            .post("/api/items")
            .set({ Cookie: `chip_auth=${token}` })
            .send(validPayload());

        expect(res.status).toBe(403);
    });

    test("creates an item and returns 201 with valid auth + CSRF", async () => {
        const { token, csrfToken } = makeToken();
        const payload = validPayload();

        const res = await request(app)
            .post("/api/items")
            .set(authHeaders(token, csrfToken))
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.data.jobNumber).toBe(payload.jobNumber);
        expect(res.body.data.status).toBe("Received");
    });

    test("returns 400 when jobNumber is missing", async () => {
        const { token, csrfToken } = makeToken();
        const { jobNumber: _removed, ...withoutJob } = validPayload();

        const res = await request(app)
            .post("/api/items")
            .set(authHeaders(token, csrfToken))
            .send(withoutJob);

        expect(res.status).toBe(400);
    });

    test("returns 400 for an invalid phone number", async () => {
        const { token, csrfToken } = makeToken();

        const res = await request(app)
            .post("/api/items")
            .set(authHeaders(token, csrfToken))
            .send(validPayload({ phoneNumber: "12345" }));

        expect(res.status).toBe(400);
    });

    test("returns 400 when the same jobNumber is used twice", async () => {
        const { token, csrfToken } = makeToken();
        const payload = validPayload();

        await request(app)
            .post("/api/items")
            .set(authHeaders(token, csrfToken))
            .send(payload);

        const res = await request(app)
            .post("/api/items")
            .set(authHeaders(token, csrfToken))
            .send(payload);

        expect(res.status).toBe(400);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// PUT /api/items/:id — update + status transitions
// ═════════════════════════════════════════════════════════════════════════════

describe("PUT /api/items/:id", () => {

    test("returns 400 for an invalid MongoDB ObjectId", async () => {
        const { token, csrfToken } = makeToken();

        const res = await request(app)
            .put("/api/items/not-a-valid-id")
            .set(authHeaders(token, csrfToken))
            .send({ brand: "Sony" });

        expect(res.status).toBe(400);
    });

    test("returns 404 for a valid ObjectId that doesn't exist", async () => {
        const { token, csrfToken } = makeToken();
        const fakeId = new mongoose.Types.ObjectId().toString();

        const res = await request(app)
            .put(`/api/items/${fakeId}`)
            .set(authHeaders(token, csrfToken))
            .send({ brand: "Sony" });

        expect(res.status).toBe(404);
    });

    test("updates a field successfully", async () => {
        const item = await createItem();
        const { token, csrfToken } = makeToken();

        const res = await request(app)
            .put(`/api/items/${item._id}`)
            .set(authHeaders(token, csrfToken))
            .send({ brand: "Sony" });

        expect(res.status).toBe(200);
        expect(res.body.data.brand).toBe("Sony");
    });

    test("transitions status and records statusHistory entry", async () => {
        const item = await createItem({ status: "Received" });
        const { token, csrfToken } = makeToken();

        const res = await request(app)
            .put(`/api/items/${item._id}`)
            .set(authHeaders(token, csrfToken))
            .send({ status: "In Progress" });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe("In Progress");
        // statusHistory now has 2 entries: the one from createItem + this update
        const statuses = res.body.data.statusHistory.map((h) => h.status);
        expect(statuses).toContain("In Progress");
    });

    test("returns 400 when trying to set Delivered without a finalCost", async () => {
        const item = await createItem({ status: "Ready", finalCost: 0 });
        const { token, csrfToken } = makeToken();

        const res = await request(app)
            .put(`/api/items/${item._id}`)
            .set(authHeaders(token, csrfToken))
            .send({ status: "Delivered" });

        expect(res.status).toBe(400);
    });

    test("sets Delivered successfully when finalCost is already on the item", async () => {
        const item = await createItem({ status: "Ready", finalCost: 999 });
        const { token, csrfToken } = makeToken();

        const res = await request(app)
            .put(`/api/items/${item._id}`)
            .set(authHeaders(token, csrfToken))
            .send({ status: "Delivered" });

        expect(res.status).toBe(200);
        expect(res.body.data.deliveredAt).not.toBeNull();
    });

    test("sets revenueRealizedAt when transitioning to Ready", async () => {
        const item = await createItem({ status: "In Progress" });
        const { token, csrfToken } = makeToken();

        const res = await request(app)
            .put(`/api/items/${item._id}`)
            .set(authHeaders(token, csrfToken))
            .send({ status: "Ready" });

        expect(res.status).toBe(200);
        expect(res.body.data.revenueRealizedAt).not.toBeNull();
    });

    test("strips disallowed fields (isDeleted cannot be set via update)", async () => {
        const item = await createItem();
        const { token, csrfToken } = makeToken();

        await request(app)
            .put(`/api/items/${item._id}`)
            .set(authHeaders(token, csrfToken))
            .send({ isDeleted: true, brand: "UpdatedBrand" });

        // Verify DB directly — the response would show the same value either way
        const dbItem = await Item.findById(item._id);
        expect(dbItem.isDeleted).toBe(false);
        expect(dbItem.brand).toBe("UpdatedBrand");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /api/items/:id — soft delete
// ═════════════════════════════════════════════════════════════════════════════

describe("DELETE /api/items/:id", () => {

    test("soft-deletes an item as admin", async () => {
        const item = await createItem();
        const { token, csrfToken } = makeToken({ role: "admin" });

        const res = await request(app)
            .delete(`/api/items/${item._id}`)
            .set(authHeaders(token, csrfToken));

        expect(res.status).toBe(200);

        const dbItem = await Item.findById(item._id);
        expect(dbItem.isDeleted).toBe(true);
    });

    test("user role (non-admin) is denied delete", async () => {
        const item = await createItem();
        const { token, csrfToken } = makeToken({ role: "user" });

        const res = await request(app)
            .delete(`/api/items/${item._id}`)
            .set(authHeaders(token, csrfToken));

        expect(res.status).toBe(403);

        // Verify the item was NOT deleted
        const dbItem = await Item.findById(item._id);
        expect(dbItem.isDeleted).toBe(false);
    });

    test("returns 404 for a non-existent item", async () => {
        const { token, csrfToken } = makeToken({ role: "admin" });
        const fakeId = new mongoose.Types.ObjectId().toString();

        const res = await request(app)
            .delete(`/api/items/${fakeId}`)
            .set(authHeaders(token, csrfToken));

        expect(res.status).toBe(404);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/items/bulk-status
// ═════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/items/bulk-status", () => {

    test("returns 400 when ids is empty", async () => {
        const { token, csrfToken } = makeToken();

        const res = await request(app)
            .patch("/api/items/bulk-status")
            .set(authHeaders(token, csrfToken))
            .send({ ids: [], status: "Ready" });

        expect(res.status).toBe(400);
    });

    test("returns 400 when trying to bulk-set Delivered", async () => {
        const item = await createItem();
        const { token, csrfToken } = makeToken();

        const res = await request(app)
            .patch("/api/items/bulk-status")
            .set(authHeaders(token, csrfToken))
            .send({ ids: [item._id.toString()], status: "Delivered" });

        expect(res.status).toBe(400);
    });

    test("bulk-updates status for valid ids and status", async () => {
        const items = await Promise.all([createItem(), createItem()]);
        const ids   = items.map((i) => i._id.toString());
        const { token, csrfToken } = makeToken();

        const res = await request(app)
            .patch("/api/items/bulk-status")
            .set(authHeaders(token, csrfToken))
            .send({ ids, status: "In Progress" });

        expect(res.status).toBe(200);
        expect(res.body.data.modifiedCount).toBe(2);

        const dbItems = await Item.find({ _id: { $in: ids } });
        expect(dbItems.every((i) => i.status === "In Progress")).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/items/track — public endpoint
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/items/track (public)", () => {

    test("returns 400 when jobNumber or phoneNumber is missing", async () => {
        const res = await request(app).get("/api/items/track?jobNumber=JOB001");
        expect(res.status).toBe(400);
    });

    test("returns 404 when no matching record is found", async () => {
        const res = await request(app)
            .get("/api/items/track?jobNumber=NOEXIST&phoneNumber=0000000000");
        expect(res.status).toBe(404);
    });

    test("returns the job when jobNumber + phoneNumber match", async () => {
        const item = await createItem({ jobNumber: "TRACK001", phoneNumber: "9111222333" });

        const res = await request(app)
            .get(`/api/items/track?jobNumber=${item.jobNumber}&phoneNumber=9111222333`);

        expect(res.status).toBe(200);
        expect(res.body.data.jobNumber).toBe("TRACK001");
    });

    test("does NOT expose customerName or full phoneNumber (PII guard)", async () => {
        await createItem({ jobNumber: "TRACK002", phoneNumber: "9222333444" });

        const res = await request(app)
            .get("/api/items/track?jobNumber=TRACK002&phoneNumber=9222333444");

        expect(res.status).toBe(200);
        expect(res.body.data).not.toHaveProperty("customerName");
        expect(res.body.data).not.toHaveProperty("phoneNumber");
    });

    test("does not require auth cookies — public access works without a session", async () => {
        await createItem({ jobNumber: "TRACK003", phoneNumber: "9333444555" });

        // Deliberately send no cookies / auth headers
        const res = await request(app)
            .get("/api/items/track?jobNumber=TRACK003&phoneNumber=9333444555");

        expect(res.status).toBe(200);
    });
});
