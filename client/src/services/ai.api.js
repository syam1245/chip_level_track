import { authFetch } from "../api";

export const aiApi = {
    /**
     * Generates a "TL;DR" job summary using AI Co-Pilot.
     * @param {Object} jobData The job details object from the UI.
     * @returns {Promise<string>} The resulting bullet points as text.
     */
    generateJobSummary: async (jobData, { forceRefresh = false } = {}) => {
        const response = await authFetch("/api/ai/summary", {
            method: "POST",
            body: JSON.stringify({ ...jobData, forceRefresh }),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to generate AI summary.");
        }

        return data.data?.summary;
    },

    /**
     * Generates business insights based on revenue and job statistics.
     * @param {Object} statsData The stats/revenue data.
     * @returns {Promise<string>} The resulting insights text.
     */
    generateInsights: async (statsData) => {
        const response = await authFetch("/api/ai/insights", {
            method: "POST",
            body: JSON.stringify(statsData),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to generate AI insights.");
        }

        return data.data?.insights;
    }
};

/**
 * Send an image to the vision extraction endpoint.
 * @param {string} base64Image - Base64-encoded image string (with or without data: prefix)
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function extractFromImage(base64Image) {
    const res = await authFetch("/api/ai/vision/extract", {
        method: "POST",
        body: JSON.stringify({ image: base64Image }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        return { ok: false, error: data.error || data.message || "Extraction failed." };
    }
    return { ok: true, data: data.data };
}

/**
 * Generate an AI-personalized WhatsApp message for a repair job.
 * @param {object} jobData - Required job details { customerName, deviceDetails, currentStatus, fault, repairCost }
 * @returns {Promise<{ok: boolean, message?: string, error?: string}>}
 */
export async function generateAiWhatsAppMessage(jobData) {
    try {
        const res = await authFetch("/api/ai/whatsapp/generate", {
            method: "POST",
            body: JSON.stringify(jobData),
        });
        const data = await res.json();

        if (!res.ok) {
            return { ok: false, error: data.error || "Failed to generate AI message" };
        }

        return { ok: true, message: data.message };
    } catch (err) {
        console.error("Error generating AI WhatsApp message:", err);
        return { ok: false, error: "Network error generating AI message" };
    }
}

