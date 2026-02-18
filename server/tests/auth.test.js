import test from "node:test";
import assert from "node:assert/strict";

import { hashPassword, verifyPassword } from "../auth/password.js";
import { createAuthToken, verifyAuthToken } from "../auth/token.js";
import { requirePermission } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

test("hashPassword stores deterministic metadata and verifies", () => {
  const hash = hashPassword("my-secret-password");
  assert.equal(typeof hash, "string");
  assert.equal(verifyPassword("my-secret-password", hash), true);
  assert.equal(verifyPassword("wrong-password", hash), false);
});

test("createAuthToken/verifyAuthToken validates signature and expiry", async () => {
  const secret = "test-secret";
  const token = createAuthToken({ username: "admin", role: ROLES.ADMIN }, secret, 1);
  const verified = verifyAuthToken(token, secret);
  assert.equal(verified.valid, true);
  assert.equal(verified.payload.username, "admin");

  await new Promise((resolve) => setTimeout(resolve, 2100));
  const expired = verifyAuthToken(token, secret);
  assert.equal(expired.valid, false);
});

test("requirePermission rejects forbidden role and accepts allowed role", () => {
  const middleware = requirePermission("items:delete");

  const forbiddenReq = { user: { role: ROLES.USER } };
  const forbiddenRes = {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  middleware(forbiddenReq, forbiddenRes, () => {});
  assert.equal(forbiddenRes.statusCode, 403);

  let nextCalled = false;
  const allowedReq = { user: { role: ROLES.ADMIN } };
  const allowedRes = { status() { return this; }, json() { return this; } };
  middleware(allowedReq, allowedRes, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});
