/**
 * Auth API service — centralizes all /api/auth network calls.
 */
import API_BASE_URL, { authFetch } from "../api";

/**
 * Fetch the current session (cookie-based).
 * @returns {Promise<{ok: boolean, user?: object}>}
 */
export async function getSession() {
    const res = await authFetch("/api/auth/session", { method: "GET" });
    if (!res.ok) return { ok: false };
    const user = await res.json();
    return { ok: true, user };
}

/**
 * Log in with username + password.
 * @returns {Promise<object>} The user object
 * @throws {Error} If login fails
 */
export async function login(username, password) {
    const res = await authFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
}

/**
 * Log out (clears cookies server-side).
 */
export async function logout() {
    await authFetch("/api/auth/logout", { method: "POST" });
}

/**
 * Fetch all users / technicians (authenticated).
 * @returns {Promise<object[]>}
 */
export async function fetchUsers() {
    const res = await authFetch("/api/auth/users");
    if (!res.ok) throw new Error("Failed to load technicians");
    return res.json();
}

/**
 * Fetch technician name list (public — no auth required, used on login page).
 * @returns {Promise<object[]>}
 */
export async function fetchTechnicianNames() {
    const res = await fetch(`${API_BASE_URL}/api/auth/technicians`);
    return res.json();
}

/**
 * Reset a technician's password.
 * @param {string} username
 * @param {object} payload - { newPassword, overrideUsername?, overridePassword? }
 * @returns {Promise<{ok: boolean, data: object, error?: string}>}
 */
export async function resetPassword(username, payload) {
    const res = await authFetch(`/api/auth/users/${username}/password`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { ok: res.ok, data, error: data.error };
}

/**
 * Toggle a user's active status (Admin only).
 * @param {string} username
 * @param {boolean} isActive
 * @returns {Promise<{ok: boolean, data: object, error?: string}>}
 */
export async function toggleUserActive(username, isActive) {
    const res = await authFetch(`/api/auth/users/${username}/active`, {
        method: "PUT",
        body: JSON.stringify({ isActive }),
    });
    const data = await res.json();
    return { ok: res.ok, data, error: data.error };
}

/**
 * Add a new technician (Admin only).
 * @param {object} payload - { username, displayName, password }
 * @returns {Promise<{ok: boolean, data: object, error?: string}>}
 */
export async function createUser(payload) {
    const res = await authFetch("/api/auth/users", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data, error: data.error || data.message || "Failed to create user" };
}

/**
 * Permanently delete a user (Admin only, requires password check).
 * @param {string} username
 * @param {string} adminPassword
 * @returns {Promise<{ok: boolean, data: object, error?: string}>}
 */
export async function deleteUser(username, adminPassword) {
    const res = await authFetch(`/api/auth/users/${username}`, {
        method: "DELETE",
        body: JSON.stringify({ adminPassword }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data, error: data.error || data.message || "Failed to delete user" };
}

/**
 * Update user profile (Admin only).
 * @param {string} oldUsername
 * @param {object} payload - { newUsername?, displayName? }
 * @returns {Promise<{ok: boolean, data: object, error?: string}>}
 */
export async function updateUser(oldUsername, payload) {
    const res = await authFetch(`/api/auth/users/${oldUsername}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data, error: data.error || data.message || "Failed to update user" };
}
