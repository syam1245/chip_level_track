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
        date: { type: SchemaType.STRING, nullable: true, description: "Extract date in YYYY-MM-DD format if possible" },
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
            model: "gemini-2.5-flash",
            systemInstruction: "You are an OCR extraction engine specializing in repair service forms. Your goal is to accurately extract handwritten and printed text and map it directly to the structured schema. Ignore company contact details. Extract handwritten notes as accurately as possible.",
        });
    }

    async extractDataFromImage(imageBuffer, mimeType) {
        const prompt = "Extract ONLY customer and device information from this repair service form. Return the data adhering to the specified JSON schema.";

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

            let rawText = result.response.text();

            // Strip markdown code block wrappers if they slip through 
            if (rawText.startsWith('```')) {
                rawText = rawText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
            }

            return JSON.parse(rawText);
        } catch (error) {
            if (error.message?.includes("429") || error.message?.includes("Quota exceeded")) {
                throw new AppError("Gemini API quota exceeded. Please wait a moment or try again later.", 429);
            }
            throw new AppError("Vision extraction service failure: " + error.message, 500);
        }
    }
}

export default new VisionService();
