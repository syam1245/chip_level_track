import { authFetch } from "../api";

/**
 * Generate an AI-personalized WhatsApp message for a repair job.
 * @param {object} jobData - Required job details { customerName, deviceDetails, currentStatus, fault, repairCost }
 * @returns {Promise<{ok: boolean, message?: string, error?: string}>}
 */
export async function generateAiWhatsAppMessage(jobData) {
    try {
        const res = await authFetch("/api/comm/generate-whatsapp", {
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
