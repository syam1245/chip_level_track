/**
 * fixtures.js — factory functions that produce valid test data.
 *
 * Keeping defaults here means tests only override the fields they care about,
 * so test intent stays obvious and field additions to the real schema only
 * need to be added in one place.
 */

import crypto from "crypto";
import jwt from "jsonwebtoken";

// ── Auth token helpers ─────────────────────────────────────────────────────────

const TEST_JWT_SECRET = "test-secret-at-least-32-chars-long!!";

/**
 * Build a signed auth cookie value that attachAuth will accept.
 * Mirrors the shape produced by createAuthToken in auth.token.js.
 */
export function makeAuthToken(overrides = {}) {
    const csrfToken = crypto.randomBytes(24).toString("hex");
    const payload = {
        username:    "testadmin",
        role:        "admin",
        displayName: "Test Admin",
        csrfToken,
        ...overrides,
        // If the caller supplied csrfToken in overrides, honour it.
        // Otherwise use the one generated above.
    };
    // Use same secret that tests inject via process.env
    const token = jwt.sign(payload, process.env.AUTH_TOKEN_SECRET ?? TEST_JWT_SECRET, {
        expiresIn: "12h",
    });
    return { token, csrfToken: payload.csrfToken };
}

/**
 * Returns headers that pass all auth + CSRF middleware checks.
 * Pass these to supertest: .set(authHeaders(token, csrf))
 */
export function authHeaders(token, csrfToken) {
    return {
        Cookie:         `chip_auth=${token}; chip_csrf=${csrfToken}`,
        "x-csrf-token": csrfToken,
    };
}

// ── Item (job) fixtures ────────────────────────────────────────────────────────

let jobCounter = 1000;

/** Returns a valid item creation payload. Override any field you need to test. */
export function makeItemPayload(overrides = {}) {
    return {
        jobNumber:   `JOB${++jobCounter}`,
        customerName: "John Doe",
        brand:        "Samsung",
        phoneNumber:  "9876543210",
        issue:        "Screen cracked",
        repairNotes:  "Customer wants express repair",
        ...overrides,
    };
}

/**
 * Minimal Mongoose-like document stub used in unit tests where we don't want
 * a real DB connection. Provides the fields that items.service.js mutates.
 */
export function makeItemDoc(overrides = {}) {
    const base = {
        _id:           "64f1a2b3c4d5e6f7a8b9c0d1",
        jobNumber:     "JOB9001",
        customerName:  "Jane Smith",
        brand:         "Apple",
        phoneNumber:   "9123456780",
        status:        "Received",
        repairNotes:   "",
        issue:         "Battery issue",
        finalCost:     0,
        statusHistory: [],
        isDeleted:     false,
        technicianName:"Test Tech",
        dueDate:       null,
        deliveredAt:   null,
        revenueRealizedAt: null,
        createdAt:     new Date("2025-01-01T10:00:00Z"),
        save:          jest.fn().mockResolvedValue(true),
        ...overrides,
    };
    // save() should resolve to the document itself by default
    if (!overrides.save) {
        base.save = jest.fn().mockResolvedValue(base);
    }
    return base;
}
