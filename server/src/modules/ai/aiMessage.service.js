import AppError from "../../core/errors/AppError.js";
import { generateTextWithFallback } from "./llmProvider.js";

/**
 * Service for handling AI-generated WhatsApp messages.
 */
class AiMessageService {
    /**
     * Sanitizes data by picking only relevant fields and stripping unwanted ones.
     * Ensures sensitive internal data is never sent to the AI.
     */
    sanitizeJobData(jobData = {}) {
        const sanitizeText = (value) =>
            typeof value === "string" ? value.replace(/[<>]/g, "").trim() : value;

        const formatCost = (cost) => {
            if (cost === undefined || cost === null || cost === "") {
                return "Not yet determined";
            }

            if (typeof cost === "number") {
                return `₹${cost}`;
            }

            const numeric = Number(cost);
            return Number.isFinite(numeric) ? `₹${numeric}` : sanitizeText(String(cost));
        };

        return {
            customerName: sanitizeText(jobData.customerName) || "Customer",
            jobNumber: sanitizeText(jobData.jobNumber) || "N/A",
            make: sanitizeText(jobData.make) || "",
            model: sanitizeText(jobData.model) || "Device",
            currentStatus:
                sanitizeText(jobData.status) ||
                sanitizeText(jobData.currentStatus) ||
                "Received",
            fault: sanitizeText(jobData.fault) || "Not specified",
            repairCost: formatCost(jobData.repairCost),
        };
    }

    /**
     * Generates a personalized WhatsApp message based on job details.
     */
    async generatePersonalizedUpdate(jobData) {
        try {
            const cleanData = this.sanitizeJobData(jobData);

            const systemInstruction =
                "You are the Senior Customer Relations Agent at 'Admin Info Solution, Haripad'. Write highly professional, empathetic, concise WhatsApp status updates. Output ONLY the raw message text without markdown code blocks.";

            const payload = JSON.stringify({
                customer: cleanData.customerName,
                job: cleanData.jobNumber,
                make: cleanData.make,
                model: cleanData.model,
                status: cleanData.currentStatus,
                fault: cleanData.fault,
                cost: cleanData.repairCost,
            });

            const prompt = `
Generate a WhatsApp update for this repair job: ${payload}

RULES:
1. DEVICE:
   - If 'make' is Apple, Dell, HP, Acer, Lenovo, ASUS, or MSI → refer to it as "your *${cleanData.make} Laptop*".
   - Otherwise use "your *${cleanData.make} ${cleanData.model}*".

2. STRUCTURE:
   Greeting → "Hi *${cleanData.customerName}*!"
   Context → "Update regarding your device (Job #${cleanData.jobNumber})."
   Status → Explain the status clearly and politely.
   Cost → Mention briefly if not "Not yet determined".
   Action → "Reply here if you have any questions!"

3. FORMAT:
   - Use *bold* for status and device name.
   - Do NOT hallucinate missing data.

4. END EXACTLY WITH:
Regards, Admin Info Solution.
_(This is an automated update)_
`;

            const text = await generateTextWithFallback(prompt, systemInstruction);

            // WhatsApp safe length guard
            const MAX_LENGTH = 1000;
            return typeof text === "string" ? text.slice(0, MAX_LENGTH) : text;

        } catch (error) {
            console.error("AI Generation Error (WhatsApp):", error);

            if (error?.statusCode) {
                throw error;
            }

            throw new AppError("Failed to generate AI message", 500);
        }
    }
}

export const aiMessageService = new AiMessageService();