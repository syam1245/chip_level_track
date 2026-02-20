import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../../core/config/index.js";
import AppError from "../../core/errors/AppError.js";

class VisionService {
    constructor() {
        if (!config.geminiApiKey) {
            console.warn("GEMINI_API_KEY not found in environment variables");
        }
        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });
    }

    async extractDataFromImage(imageBuffer, mimeType) {
        const prompt = `
You are an OCR extraction engine specializing in repair service forms.

Extract ONLY customer and device information from this form.
Ignore company contact details.

Return ONLY valid JSON using this exact structure:

{
  "jobNumber": string | null,
  "customerName": string | null,
  "customerMobileNo": string | null,
  "customerEmail": string | null,
  "item": string | null,
  "make": string | null,
  "model": string | null,
  "serialNumber": string | null,
  "date": string | null,
  "accessories": {
    "powerAdapter": boolean,
    "powerCord": boolean,
    "carryCase": boolean,
    "battery": boolean,
    "others": string | null
  },
  "remarks": string | null,
  "handwrittenNotes": string | null
}

Rules:
- If a field is missing or unreadable, return null.
- For checkboxes ("accessories"), return true if checked, false otherwise.
- Extract handwritten notes as accurately as possible.
- Do NOT wrap the JSON in markdown code blocks.
- Return ONLY the JSON object.
`;

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
                    temperature: 0,
                },
            });

            const rawText = result.response.text();
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
