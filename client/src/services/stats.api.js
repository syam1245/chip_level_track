/**
 * Stats API service — centralizes all /api/stats network calls.
 */
import { authFetch } from "../api";

/**
 * Fetch revenue report data for a date range.
 * @param {string} [startDate]
 * @param {string} [endDate]
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function fetchRevenue(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const res = await authFetch(`/api/stats/revenue?${params.toString()}`);
    if (!res.ok) return { ok: false, error: "Failed to fetch revenue data" };
    const data = await res.json();
    return { ok: true, data };
}
