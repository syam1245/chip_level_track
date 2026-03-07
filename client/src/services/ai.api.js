import { authFetch } from "../api";

export const aiApi = {
    /**
     * Generates a "TL;DR" job summary using AI Co-Pilot.
     * @param {Object} jobData The job details object from the UI.
     * @returns {Promise<string>} The resulting bullet points as text.
     */
    generateJobSummary: async (jobData) => {
        const response = await authFetch("/api/ai/summary", {
            method: "POST",
            body: JSON.stringify(jobData),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to generate AI summary.");
        }

        return data.data?.summary;
    }
};
