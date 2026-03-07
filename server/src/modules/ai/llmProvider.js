import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import config from "../../core/config/index.js";
import AppError from "../../core/errors/AppError.js";

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const groq = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

// Safety limits
const MAX_PROMPT_LENGTH = 15000;
const LLM_TIMEOUT_MS = 15000;
const RETRY_ATTEMPTS = 1;

/**
 * Utility: safe timeout wrapper to prevent hanging requests
 */
function withTimeout(promise, ms = LLM_TIMEOUT_MS) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("LLM request timeout")), ms)
  );

  return Promise.race([promise, timeout]);
}

/**
 * Utility: retry wrapper for transient failures
 */
async function withRetry(fn, attempts = RETRY_ATTEMPTS) {
  let lastError;

  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Retry only if not the final attempt
      if (i === attempts) break;
    }
  }

  throw lastError;
}

/**
 * Utility: detect rate limit errors across providers
 */
function isRateLimitError(error) {
  if (!error) return false;

  return (
    error.status === 429 ||
    error.code === 429 ||
    error.message?.includes("429") ||
    error.message?.toLowerCase().includes("rate limit") ||
    error.message?.toLowerCase().includes("quota")
  );
}

/**
 * Validate LLM response text
 */
function validateResponse(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid AI response");
  }

  const trimmed = text.trim();

  if (trimmed.length < 3) {
    throw new Error("Empty AI response");
  }

  return trimmed;
}

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

  const completion = await groq.chat.completions.create({
    messages,
    model: "llama-3.1-8b-instant",
    temperature: 0.2,
  });

  const text = completion.choices?.[0]?.message?.content;

  return validateResponse(text);
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

  return validateResponse(response.text());
}

/**
 * Main generation method with provider fallback.
 *
 * Flow:
 * 1. Try Groq (primary provider)
 * 2. If Groq fails → fallback to Gemini
 * 3. If Gemini also fails → return user-safe error
 */
export async function generateTextWithFallback(prompt, systemInstruction = "") {
  if (!prompt || typeof prompt !== "string") {
    throw new AppError("Invalid AI prompt", 400);
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new AppError("Prompt too large for AI processing", 400);
  }

  let lastError = null;

  // Attempt 1: Groq
  if (groq) {
    try {
      console.log("LLM Provider: Attempting Groq (llama-3.1-8b-instant)...");

      const result = await withRetry(() =>
        withTimeout(generateWithGroq(prompt, systemInstruction))
      );

      return result;
    } catch (error) {
      console.warn(`Groq Provider Failed: ${error.message}`);
      lastError = error;
    }
  }

  // Attempt 2: Gemini fallback
  try {
    console.log("LLM Provider: Attempting Gemini Fallback...");

    const result = await withRetry(() =>
      withTimeout(generateWithGemini(prompt, systemInstruction))
    );

    return result;
  } catch (error) {
    console.error(`Gemini Provider Failed: ${error.message}`);

    if (isRateLimitError(error) || isRateLimitError(lastError)) {
      throw new AppError(
        "AI service is temporarily busy. Please try again shortly.",
        429
      );
    }

    throw new AppError("AI Co-Pilot is currently unavailable.", 503);
  }
}