/**
 * Items API service — centralizes all /api/items network calls.
 * Components should import from here instead of calling authFetch directly.
 */
import API_BASE_URL, { authFetch } from "../api";

/**
 * Track a job by job number and phone number (public — no auth).
 * @param {string} jobNumber
 * @param {string} phoneNumber
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function trackItem(jobNumber, phoneNumber) {
    const res = await fetch(
        `${API_BASE_URL}/api/items/track?jobNumber=${encodeURIComponent(jobNumber)}&phoneNumber=${encodeURIComponent(phoneNumber)}`
    );
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Failed to find repair job." };
    return { ok: true, data };
}

/**
 * Fetch a paginated list of items with optional filters.
 * @param {object} params
 * @param {AbortSignal} [params.signal] - Optional AbortController signal
 * @returns {Promise<{items, currentPage, totalPages, totalItems, stats}>}
 */
export async function fetchItems({
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    search = "",
    statusGroup = "",
    technicianName = "",
    includeMetadata = false,
    signal,
} = {}) {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
    });

    if (includeMetadata) params.set("includeMetadata", "true");
    if (technicianName && technicianName !== "All") params.set("technicianName", technicianName);
    if (search) params.set("search", search);
    else if (statusGroup && statusGroup !== "all") params.set("statusGroup", statusGroup);

    const res = await authFetch(`/api/items?${params.toString()}`, { method: "GET", signal });
    return res.json();
}

/**
 * Create a new item.
 * @param {object} itemData - { jobNumber, customerName, brand, phoneNumber, issue, cost }
 * @returns {Promise<object>} The created item
 */
export async function createItem(itemData) {
    const res = await authFetch("/api/items", {
        method: "POST",
        body: JSON.stringify(itemData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create item");
    return data;
}

/**
 * Update an existing item by ID.
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<{ok: boolean, data: object, error?: string}>}
 */
export async function updateItem(id, updates) {
    const res = await authFetch(`/api/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
    });
    const data = await res.json();
    return { ok: res.ok, data, error: data.error };
}

/**
 * Soft-delete an item by ID.
 * @param {string} id
 * @returns {Promise<{ok: boolean}>}
 */
export async function deleteItem(id) {
    const res = await authFetch(`/api/items/${id}`, { method: "DELETE" });
    return { ok: res.ok };
}

/**
 * Bulk-update status for multiple items.
 * @param {string[]} ids
 * @param {string} status
 * @returns {Promise<{ok: boolean, data: object, error?: string}>}
 */
export async function bulkUpdateStatus(ids, status) {
    const res = await authFetch("/api/items/bulk-status", {
        method: "PATCH",
        body: JSON.stringify({ ids, status }),
    });
    const data = await res.json();
    return { ok: res.ok, data, error: data.error };
}

/**
 * Search items (used by admin audit trail).
 * @param {string} query
 * @param {number} [limit=15]
 * @returns {Promise<{items: object[]}>}
 */
export async function searchItems(query, limit = 15) {
    const res = await authFetch(
        `/api/items?search=${encodeURIComponent(query)}&includeMetadata=true&limit=${limit}`
    );
    if (!res.ok) throw new Error("Search failed");
    return res.json();
}
