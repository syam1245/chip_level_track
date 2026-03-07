import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import config from "../../core/config/index.js";
import AppError from "../../core/errors/AppError.js";

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

/**
 * Helper to generate text using Groq.
 */
async function generateWithGroq(prompt, systemInstruction) {
    if (!groq) throw new Error("Groq API key not configured");

    const messages = [];
    if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const chatCompletion = await groq.chat.completions.create({
        messages,
        model: "llama-3.1-8b-instant",
        temperature: 0.2, // Keep it deterministic for technical summaries
    });

    return chatCompletion.choices[0]?.message?.content || "";
}

/**
 * Helper to generate text using Gemini.
 */
async function generateWithGemini(prompt, systemInstruction) {
    const modelOptions = { model: config.geminiModel };
    if (systemInstruction) {
        modelOptions.systemInstruction = systemInstruction;
    }
    const model = genAI.getGenerativeModel(modelOptions);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
}

/**
 * Tries Groq first (higher rate limits). If it fails with a 429, falls back to Gemini.
 * If Gemini also fails with a 429, throws an AppError to the user.
 * 
 * @param {string} prompt The main user prompt
 * @param {string} systemInstruction The system role/instruction
 * @returns {Promise<string>} The generated text
 */
export async function generateTextWithFallback(prompt, systemInstruction = "") {
    let lastError = null;

    // 1. Try Primary Provider (Groq - 30 RPM, 14.4k RPD)
    try {
        if (groq) {
            console.log("LLM Provider: Attempting Groq (llama-3.1-8b-instant)...");
            return await generateWithGroq(prompt, systemInstruction);
        }
    } catch (error) {
        console.warn(`Groq Provider Failed: ${error.message}`);
        // If it's a rate limit or service unavailability, we fallback.
        // If groq is just null, we also fallback.
        lastError = error;
    }

    // 2. Try Secondary Provider (Gemini - 15 RPM, 1.5k RPD)
    try {
        console.log("LLM Provider: Attempting Gemini Fallback...");
        return await generateWithGemini(prompt, systemInstruction);
    } catch (error) {
        console.error(`Gemini Provider Failed: ${error.message}`);

        // Check if Gemini failed due to limits
        if (error.status === 429 || error.message?.includes("429") || error.message?.includes("Quota")) {
            throw new AppError("All AI API quotas exceeded. Please try again in 30 seconds.", 429);
        }

        // Otherwise throw generic server error
        throw new AppError("AI Co-Pilot is currently unavailable.", 503);
    }
}
