import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import config from "../../core/config/index.js";
import AppError from "../../core/errors/AppError.js";

const extractionSchema = {
    type: SchemaType.OBJECT,
    properties: {
        jobNumber: { type: SchemaType.STRING, nullable: true },
        customerName: { type: SchemaType.STRING, nullable: true },
        customerMobileNo: { type: SchemaType.STRING, nullable: true },
        customerEmail: { type: SchemaType.STRING, nullable: true },
        item: { type: SchemaType.STRING, nullable: true },
        make: { type: SchemaType.STRING, nullable: true },
        model: { type: SchemaType.STRING, nullable: true },
        serialNumber: { type: SchemaType.STRING, nullable: true },
        date: {
            type: SchemaType.STRING,
            nullable: true,
            description: "Extract date in YYYY-MM-DD format if possible"
        },
        accessories: {
            type: SchemaType.OBJECT,
            properties: {
                powerAdapter: { type: SchemaType.BOOLEAN },
                powerCord: { type: SchemaType.BOOLEAN },
                carryCase: { type: SchemaType.BOOLEAN },
                battery: { type: SchemaType.BOOLEAN },
                others: { type: SchemaType.STRING, nullable: true }
            }
        },
        remarks: { type: SchemaType.STRING, nullable: true },
        handwrittenNotes: { type: SchemaType.STRING, nullable: true }
    }
};

class VisionService {
    constructor() {
        if (!config.geminiApiKey) {
            console.warn("GEMINI_API_KEY not found in environment variables");
        }

        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);

        this.model = this.genAI.getGenerativeModel({
            model: config.geminiModel,
            systemInstruction:
                "You are an OCR extraction engine specializing in repair service forms. Extract handwritten and printed text accurately and map it directly to the provided schema. Ignore company contact details and headers/footers. Return only structured data.",
        });
    }

    stripMarkdownCodeBlocks(text) {
        if (!text) return text;

        const trimmed = text.trim();

        if (trimmed.startsWith("```")) {
            return trimmed
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```$/, "")
                .trim();
        }

        return trimmed;
    }

    async extractDataFromImage(imageBuffer, mimeType) {
        if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
            throw new AppError("Invalid image buffer provided", 400);
        }

        if (!mimeType || typeof mimeType !== "string") {
            throw new AppError("Invalid image MIME type", 400);
        }

        const prompt =
            "Extract ONLY customer and device information from this repair service form. Return the data strictly following the provided JSON schema.";

        try {
            const result = await this.model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    data: imageBuffer.toString("base64"),
                                    mimeType,
                                },
                            },
                        ],
                    },
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: extractionSchema,
                    temperature: 0,
                },
            });

            if (!result || !result.response) {
                throw new Error("Empty response from Gemini API");
            }

            let rawText = result.response.text();

            if (!rawText) {
                throw new Error("Empty response text from Gemini API");
            }

            rawText = this.stripMarkdownCodeBlocks(rawText);

            try {
                return JSON.parse(rawText);
            } catch (parseError) {
                throw new Error("Failed to parse JSON response from Gemini");
            }
        } catch (error) {
            const message = error?.message || "Unknown error";

            if (
                message.includes("429") ||
                message.toLowerCase().includes("quota") ||
                message.toLowerCase().includes("rate limit")
            ) {
                throw new AppError(
                    "Gemini API quota exceeded. Please wait a moment or try again later.",
                    429
                );
            }

            throw new AppError(
                "Vision extraction service failure: " + message,
                500
            );
        }
    }
}

export default new VisionService();