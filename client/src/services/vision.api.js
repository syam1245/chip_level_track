/**
 * Vision API service — centralizes all /api/vision network calls.
 */
import { authFetch } from "../api";

/**
 * Send an image to the vision extraction endpoint.
 * @param {string} base64Image - Base64-encoded image string (with or without data: prefix)
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function extractFromImage(base64Image) {
    const res = await authFetch("/api/vision/extract", {
        method: "POST",
        body: JSON.stringify({ image: base64Image }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        return { ok: false, error: data.error || data.message || "Extraction failed." };
    }
    return { ok: true, data: data.data };
}
