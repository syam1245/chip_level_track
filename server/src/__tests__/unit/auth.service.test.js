/**
 * auth.service.test.js
 *
 * Unit tests for AuthService.
 * AuthRepository and createAuthToken are mocked — no DB, no JWT signing.
 */

import { jest } from "@jest/globals";
import bcrypt from "bcryptjs";

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockRepo = {
    findByUsername:  jest.fn(),
    createUser:      jest.fn(),
    updatePassword:  jest.fn(),
    toggleActive:    jest.fn(),
    deleteUser:      jest.fn(),
    updateUser:      jest.fn(),
    findAllUsers:    jest.fn(),
    findAllTechnicianNames: jest.fn(),
};

jest.unstable_mockModule("../../modules/auth/auth.repository.js", () => ({
    default: mockRepo,
}));

const mockCreateToken = jest.fn().mockReturnValue("signed.jwt.token");
jest.unstable_mockModule("../../modules/auth/auth.token.js", () => ({
    createAuthToken: mockCreateToken,
}));

const { default: AuthService } = await import("../../modules/auth/auth.service.js");

// ── Helpers ───────────────────────────────────────────────────────────────────

async function makeUser(overrides = {}) {
    const password = await bcrypt.hash("correctpassword", 10);
    return {
        username:    "testuser",
        password,
        displayName: "Test User",
        role:        "user",
        isActive:    true,
        ...overrides,
    };
}

beforeEach(() => jest.clearAllMocks());

// ═════════════════════════════════════════════════════════════════════════════
// login
// ═════════════════════════════════════════════════════════════════════════════

describe("AuthService.login", () => {

    test("returns token + user on valid credentials", async () => {
        const user = await makeUser();
        mockRepo.findByUsername.mockResolvedValue(user);

        const result = await AuthService.login("testuser", "correctpassword");

        expect(result.token).toBe("signed.jwt.token");
        expect(result.user).toMatchObject({ username: "testuser", role: "user" });
        expect(result.csrfToken).toBeTruthy();
    });

    test("throws 401 when user is not found", async () => {
        mockRepo.findByUsername.mockResolvedValue(null);

        await expect(AuthService.login("ghost", "password"))
            .rejects.toMatchObject({ statusCode: 401 });
    });

    test("throws 401 when password is wrong", async () => {
        const user = await makeUser();
        mockRepo.findByUsername.mockResolvedValue(user);

        await expect(AuthService.login("testuser", "wrongpassword"))
            .rejects.toMatchObject({ statusCode: 401 });
    });

    test("throws 403 when account is deactivated", async () => {
        const user = await makeUser({ isActive: false });
        mockRepo.findByUsername.mockResolvedValue(user);

        await expect(AuthService.login("testuser", "correctpassword"))
            .rejects.toMatchObject({ statusCode: 403 });
    });

    test("does not include password hash in the returned user object", async () => {
        const user = await makeUser();
        mockRepo.findByUsername.mockResolvedValue(user);

        const result = await AuthService.login("testuser", "correctpassword");

        expect(result.user).not.toHaveProperty("password");
    });

    test("passes csrfToken into the JWT payload", async () => {
        const user = await makeUser();
        mockRepo.findByUsername.mockResolvedValue(user);

        await AuthService.login("testuser", "correctpassword");

        const [payload] = mockCreateToken.mock.calls[0];
        expect(payload).toHaveProperty("csrfToken");
        expect(typeof payload.csrfToken).toBe("string");
        expect(payload.csrfToken.length).toBeGreaterThan(0);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// verifyCredentials
// ═════════════════════════════════════════════════════════════════════════════

describe("AuthService.verifyCredentials", () => {

    test("returns true for correct credentials", async () => {
        const user = await makeUser({ role: "admin" });
        mockRepo.findByUsername.mockResolvedValue(user);

        const result = await AuthService.verifyCredentials("testuser", "correctpassword");
        expect(result).toBe(true);
    });

    test("returns false for wrong password", async () => {
        const user = await makeUser();
        mockRepo.findByUsername.mockResolvedValue(user);

        expect(await AuthService.verifyCredentials("testuser", "badpass")).toBe(false);
    });

    test("returns false for non-existent user", async () => {
        mockRepo.findByUsername.mockResolvedValue(null);
        expect(await AuthService.verifyCredentials("ghost", "pass")).toBe(false);
    });

    test("returns false when requiredRole doesn't match", async () => {
        const user = await makeUser({ role: "user" });
        mockRepo.findByUsername.mockResolvedValue(user);

        expect(await AuthService.verifyCredentials("testuser", "correctpassword", "admin"))
            .toBe(false);
    });

    test("returns true when requiredRole matches", async () => {
        const user = await makeUser({ role: "admin" });
        mockRepo.findByUsername.mockResolvedValue(user);

        expect(await AuthService.verifyCredentials("testuser", "correctpassword", "admin"))
            .toBe(true);
    });

    test("returns false for a deactivated account even with correct password", async () => {
        const user = await makeUser({ isActive: false });
        mockRepo.findByUsername.mockResolvedValue(user);

        expect(await AuthService.verifyCredentials("testuser", "correctpassword")).toBe(false);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// createUser
// ═════════════════════════════════════════════════════════════════════════════

describe("AuthService.createUser", () => {

    test("throws 400 when username is already taken", async () => {
        const user = await makeUser();
        mockRepo.findByUsername.mockResolvedValue(user);

        await expect(AuthService.createUser("testuser", "pass", "Display"))
            .rejects.toMatchObject({ statusCode: 400, message: /already taken/ });
    });

    test("hashes the password before saving", async () => {
        mockRepo.findByUsername.mockResolvedValue(null);
        mockRepo.createUser.mockResolvedValue({ username: "newuser", role: "user" });

        await AuthService.createUser("newuser", "plainpassword", "New User");

        const [savedData] = mockRepo.createUser.mock.calls[0];
        expect(savedData.password).not.toBe("plainpassword");
        expect(savedData.password).toMatch(/^\$2[ab]\$\d+\$/); // bcrypt hash pattern
    });

    test("saves with correct role when provided", async () => {
        mockRepo.findByUsername.mockResolvedValue(null);
        mockRepo.createUser.mockResolvedValue({});

        await AuthService.createUser("newadmin", "password123", "New Admin", "admin");

        const [savedData] = mockRepo.createUser.mock.calls[0];
        expect(savedData.role).toBe("admin");
    });

    test("defaults role to 'user' when not specified", async () => {
        mockRepo.findByUsername.mockResolvedValue(null);
        mockRepo.createUser.mockResolvedValue({});

        await AuthService.createUser("newuser", "password123", "New User");

        const [savedData] = mockRepo.createUser.mock.calls[0];
        expect(savedData.role).toBe("user");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// updatePassword
// ═════════════════════════════════════════════════════════════════════════════

describe("AuthService.updatePassword", () => {

    test("throws 404 when user is not found", async () => {
        mockRepo.findByUsername.mockResolvedValue(null);

        await expect(AuthService.updatePassword("ghost", "newpass"))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test("saves a new bcrypt hash (not the plain password)", async () => {
        const user = await makeUser();
        mockRepo.findByUsername.mockResolvedValue(user);
        mockRepo.updatePassword.mockResolvedValue(true);

        await AuthService.updatePassword("testuser", "mynewpassword");

        const [, savedHash] = mockRepo.updatePassword.mock.calls[0];
        expect(savedHash).not.toBe("mynewpassword");
        expect(savedHash).toMatch(/^\$2[ab]\$\d+\$/);
    });

    test("the new hash is different from the old hash", async () => {
        const user = await makeUser();
        const oldHash = user.password;
        mockRepo.findByUsername.mockResolvedValue(user);
        mockRepo.updatePassword.mockResolvedValue(true);

        await AuthService.updatePassword("testuser", "mynewpassword");

        const [, newHash] = mockRepo.updatePassword.mock.calls[0];
        expect(newHash).not.toBe(oldHash);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// updateUser
// ═════════════════════════════════════════════════════════════════════════════

describe("AuthService.updateUser", () => {

    test("throws 404 when user to update is not found", async () => {
        mockRepo.findByUsername.mockResolvedValue(null);

        await expect(AuthService.updateUser("ghost", { username: "newname" }))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    test("throws 400 when the new username is already taken by someone else", async () => {
        const originalUser   = await makeUser({ username: "alice" });
        const conflictingUser = await makeUser({ username: "bob" });

        mockRepo.findByUsername
            .mockResolvedValueOnce(originalUser)   // lookup of 'alice' — found
            .mockResolvedValueOnce(conflictingUser); // collision check for 'bob' — taken

        await expect(AuthService.updateUser("alice", { username: "bob" }))
            .rejects.toMatchObject({ statusCode: 400, message: /already taken/ });
    });

    test("allows updating displayName without a username collision check", async () => {
        const user = await makeUser();
        mockRepo.findByUsername.mockResolvedValue(user);
        mockRepo.updateUser.mockResolvedValue(true);

        await AuthService.updateUser("testuser", { displayName: "Updated Name" });

        // findByUsername should only have been called once (for the initial lookup)
        expect(mockRepo.findByUsername).toHaveBeenCalledTimes(1);
        expect(mockRepo.updateUser).toHaveBeenCalled();
    });
});
