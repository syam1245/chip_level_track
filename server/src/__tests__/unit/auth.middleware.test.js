/**
 * auth.middleware.test.js
 *
 * Pure unit tests for the four auth middleware functions.
 * No DB, no HTTP server — just function calls with mock req/res objects.
 */

import { jest } from "@jest/globals";
import crypto from "crypto";
import jwt from "jsonwebtoken";

process.env.AUTH_TOKEN_SECRET = "test-secret-at-least-32-chars-long!!";
process.env.NODE_ENV = "test";

const {
    attachAuth,
    requireAuth,
    requirePermission,
    requireCsrf,
} = await import("../../modules/auth/auth.middleware.js");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRes() {
    const res = {
        status: jest.fn().mockReturnThis(),
        json:   jest.fn().mockReturnThis(),
    };
    return res;
}

function makeReq(overrides = {}) {
    return {
        headers: {},
        user:    null,
        cookies: {},
        method:  "GET",
        ...overrides,
    };
}

function signToken(payload) {
    return jwt.sign(payload, process.env.AUTH_TOKEN_SECRET, { expiresIn: "1h" });
}

function buildValidAuthSetup(role = "admin") {
    const csrfToken = crypto.randomBytes(24).toString("hex");
    const token = signToken({
        username:    "testuser",
        role,
        displayName: "Test User",
        csrfToken,
    });

    const req = makeReq({
        method:  "POST",
        headers: {
            cookie:         `chip_auth=${token}; chip_csrf=${csrfToken}`,
            "x-csrf-token": csrfToken,
        },
    });
    return req;
}

// ═════════════════════════════════════════════════════════════════════════════
// attachAuth
// ═════════════════════════════════════════════════════════════════════════════

describe("attachAuth", () => {

    test("sets req.user from a valid signed cookie", () => {
        const csrfToken = "abc123";
        const token = signToken({ username: "alice", role: "admin", displayName: "Alice", csrfToken });

        const req = makeReq({ headers: { cookie: `chip_auth=${token}` } });
        const next = jest.fn();

        attachAuth(req, makeRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toMatchObject({ username: "alice", role: "admin" });
    });

    test("leaves req.user as null when no auth cookie is present", () => {
        const req = makeReq({ headers: {} });
        const next = jest.fn();

        attachAuth(req, makeRes(), next);

        expect(req.user).toBeNull();
        expect(next).toHaveBeenCalled();
    });

    test("leaves req.user as null when the cookie is tampered with", () => {
        const req = makeReq({ headers: { cookie: "chip_auth=bogus.token.here" } });
        const next = jest.fn();

        attachAuth(req, makeRes(), next);

        expect(req.user).toBeNull();
        expect(next).toHaveBeenCalled();
    });

    test("leaves req.user as null when the cookie is signed with a different secret", () => {
        const badToken = jwt.sign({ username: "hacker" }, "wrong-secret", { expiresIn: "1h" });
        const req = makeReq({ headers: { cookie: `chip_auth=${badToken}` } });
        const next = jest.fn();

        attachAuth(req, makeRes(), next);

        expect(req.user).toBeNull();
    });

    test("always calls next() even on invalid tokens", () => {
        const req = makeReq({ headers: { cookie: "chip_auth=garbage" } });
        const next = jest.fn();

        attachAuth(req, makeRes(), next);

        expect(next).toHaveBeenCalled();
    });

    test("parses multiple cookies from a single Cookie header", () => {
        const csrfToken = "csrf123";
        const token = signToken({ username: "bob", role: "user", displayName: "Bob", csrfToken });
        const req = makeReq({
            headers: { cookie: `other=value; chip_auth=${token}; chip_csrf=${csrfToken}` },
        });
        const next = jest.fn();

        attachAuth(req, makeRes(), next);

        expect(req.user).not.toBeNull();
        expect(req.cookies.chip_csrf).toBe(csrfToken);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// requireAuth
// ═════════════════════════════════════════════════════════════════════════════

describe("requireAuth", () => {

    test("calls next() when req.user is set", () => {
        const req  = makeReq({ user: { username: "alice", role: "admin" } });
        const res  = makeRes();
        const next = jest.fn();

        requireAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test("returns 401 when req.user is null", () => {
        const req  = makeReq({ user: null });
        const res  = makeRes();
        const next = jest.fn();

        requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// requirePermission
// ═════════════════════════════════════════════════════════════════════════════

describe("requirePermission", () => {

    test("admin has all item permissions", () => {
        const permissions = ["items:create", "items:read", "items:update", "items:delete", "items:backup"];
        for (const perm of permissions) {
            const req  = makeReq({ user: { role: "admin" } });
            const next = jest.fn();
            requirePermission(perm)(req, makeRes(), next);
            expect(next).toHaveBeenCalled();
        }
    });

    test("user role is denied items:delete", () => {
        const req  = makeReq({ user: { role: "user" } });
        const res  = makeRes();
        const next = jest.fn();

        requirePermission("items:delete")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("user role is denied items:backup", () => {
        const req  = makeReq({ user: { role: "user" } });
        const res  = makeRes();
        const next = jest.fn();

        requirePermission("items:backup")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("user role is denied admin:access", () => {
        const req  = makeReq({ user: { role: "user" } });
        const res  = makeRes();
        const next = jest.fn();

        requirePermission("admin:access")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("user role IS allowed items:create", () => {
        const req  = makeReq({ user: { role: "user" } });
        const next = jest.fn();

        requirePermission("items:create")(req, makeRes(), next);

        expect(next).toHaveBeenCalled();
    });

    test("unknown role is denied every permission", () => {
        const req  = makeReq({ user: { role: "ghost" } });
        const res  = makeRes();
        const next = jest.fn();

        requirePermission("items:read")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when req.user is null (no role at all)", () => {
        const req  = makeReq({ user: null });
        const res  = makeRes();
        const next = jest.fn();

        requirePermission("items:read")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// requireCsrf
// ═════════════════════════════════════════════════════════════════════════════

describe("requireCsrf", () => {

    test("passes GET requests without checking CSRF", () => {
        const req  = makeReq({ method: "GET", user: { csrfToken: "token" } });
        const next = jest.fn();

        requireCsrf(req, makeRes(), next);

        expect(next).toHaveBeenCalled();
    });

    test("passes HEAD requests without checking CSRF", () => {
        const req  = makeReq({ method: "HEAD", user: { csrfToken: "token" } });
        const next = jest.fn();

        requireCsrf(req, makeRes(), next);

        expect(next).toHaveBeenCalled();
    });

    test("passes a valid POST with matching header and cookie", () => {
        const req  = buildValidAuthSetup("admin");
        // attachAuth hasn't run yet in this unit test, so parse cookies manually
        attachAuth(req, makeRes(), () => {});
        const next = jest.fn();

        requireCsrf(req, makeRes(), next);

        expect(next).toHaveBeenCalled();
    });

    test("returns 403 when x-csrf-token header is missing on POST", () => {
        const req = buildValidAuthSetup("admin");
        attachAuth(req, makeRes(), () => {});
        delete req.headers["x-csrf-token"];

        const res  = makeRes();
        const next = jest.fn();

        requireCsrf(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when the CSRF header doesn't match the token in the cookie", () => {
        const req = buildValidAuthSetup("admin");
        attachAuth(req, makeRes(), () => {});
        // Tamper with the header value
        req.headers["x-csrf-token"] = "completely-wrong-value";

        const res  = makeRes();
        const next = jest.fn();

        requireCsrf(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 for DELETE requests with no CSRF token", () => {
        const req  = makeReq({ method: "DELETE", user: { csrfToken: "tok" }, cookies: {} });
        const res  = makeRes();
        const next = jest.fn();

        requireCsrf(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test("returns 403 when req.user has no csrfToken (unauthenticated)", () => {
        const req = makeReq({
            method:  "POST",
            user:    { role: "user" }, // no csrfToken property
            cookies: { chip_csrf: "something" },
            headers: { "x-csrf-token": "something" },
        });
        const res  = makeRes();
        const next = jest.fn();

        requireCsrf(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
    });
});
