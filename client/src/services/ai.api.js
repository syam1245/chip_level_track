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
