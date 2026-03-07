import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../../core/config/index.js";
import AppError from "../../core/errors/AppError.js";

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Service for handling AI-generated messages via Gemini.
 */
class AiMessageService {
    /**
     * Sanitizes data by picking only relevant fields and stripping unwanted ones.
     * Ensures we don't pass sensitive internal notes to the AI.
     */
    sanitizeJobData(jobData) {
        if (!jobData) return {};

        // Helper to format cost properly (only add ₹ if it's a number)
        const formatCost = (cost) => {
            if (!cost) return "Not yet determined";
            return isNaN(cost) ? cost : `₹${cost}`;
        };

        return {
            customerName: jobData.customerName || "Customer",
            jobNumber: jobData.jobNumber || "N/A",
            make: jobData.make || "",
            model: jobData.model || "Device",
            currentStatus: jobData.status || jobData.currentStatus || "Received",
            fault: jobData.fault || "Not specified",
            repairCost: formatCost(jobData.repairCost),
        };
    }

    /**
     * Generates a personalized WhatsApp message based on job details.
     */
    async generatePersonalizedUpdate(jobData) {
        try {
            const cleanData = this.sanitizeJobData(jobData);
            // 1. Separate AI Role/System Instructions for better constraint following and caching
            const model = genAI.getGenerativeModel({
                model: config.geminiModel,
                systemInstruction: "You are the Senior Customer Relations Agent at 'Admin Info Solution, Haripad'. Write highly professional, empathetic, and concise WhatsApp status updates. Output ONLY the raw message text, without markdown code blocks."
            });

            // 2. Compress data into a clean JSON structure to save tokens over long lists
            const payload = JSON.stringify({
                customer: cleanData.customerName,
                job: cleanData.jobNumber,
                make: cleanData.make,
                model: cleanData.model,
                status: cleanData.currentStatus,
                fault: cleanData.fault,
                cost: cleanData.repairCost
            });

            // 3. Compacted Prompt using concise rules
            const prompt = `
Generate a WhatsApp update for this repair job: ${payload}

RULES:
1. DEVICE: If 'make' is Apple, Dell, HP, Acer, Lenovo, ASUS, or MSI, refer to it as "your *${cleanData.make} Laptop*". Otherwise, use "your *${cleanData.make} ${cleanData.model}*".
2. STRUCTURE:
   - Greeting: "Hi *${cleanData.customerName}*!"
   - Context: "Update regarding your device (Job #${cleanData.jobNumber})."
   - Status: Explain friendly. ('Ready' = ready for pickup; 'In Progress' = actively working; 'Waiting for Parts' = sourcing parts).
   - Cost: Mention briefly if not "Not yet determined".
   - Action: "Reply here if you have any questions!"
3. FORMAT: Use *bold* for status and device name. DO NOT hallucinate missing data.
4. End exactly with:
Regards, Admin Info Solution.
_(This is an automated update)_
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim(); // .trim() removes any accidental leading/trailing whitespace

        } catch (error) {
            console.error("Gemini API Error:", error);
            throw new AppError("Failed to generate AI message", 500);
        }
    }
}

export const aiMessageService = new AiMessageService();