import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../../core/config/index.js";
import AppError from "../../core/errors/AppError.js";

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

class AiService {
    /**
     * Sanitizes job data for summary generation.
     */
    sanitizeJobData(jobData) {
        if (!jobData) return {};
        return {
            jobNumber: jobData.jobNumber || "N/A",
            customerName: jobData.customerName || "Customer",
            make: jobData.make || "",
            model: jobData.model || "",
            fault: jobData.fault || "Not specified",
            status: jobData.status || "Received",
            repairNotes: jobData.repairNotes || "",
        };
    }

    /**
     * Generates a "TL;DR" summary for a repair job.
     */
    async generateJobSummary(jobData) {
        try {
            const cleanData = this.sanitizeJobData(jobData);

            const model = genAI.getGenerativeModel({
                model: config.geminiModel,
                systemInstruction: "You are an expert technician assistant. Your task is to summarize repair job notes. Output EXACTLY 3 bullet points, no markdown formatting like **bold** or headers. Bullet 1: Core Issue. Bullet 2: Current exact status based on notes. Bullet 3: Next step or blocker."
            });

            const payload = JSON.stringify(cleanData);

            const prompt = `
Generate a quick summary for this repair job: ${payload}

RULES:
1. Provide exactly 3 bullet points using a standard dash (-) or bullet character (•).
2. Bullet 1: Core issue/complaint.
3. Bullet 2: Current status/what has been done.
4. Bullet 3: Next step or what we are waiting for.
5. Do NOT include greetings or any other text.
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();

        } catch (error) {
            console.error("Gemini API Error (Summary):", error);
            // Re-throw with a specific error so the frontend knows it's an AI failure
            if (error.status === 429) {
                throw new AppError("AI API quota exceeded. Please try again later.", 429);
            }
            throw new AppError("AI Co-Pilot is currently unavailable.", 503);
        }
    }
}

export const aiService = new AiService();
