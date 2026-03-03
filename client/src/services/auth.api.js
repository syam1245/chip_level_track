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
