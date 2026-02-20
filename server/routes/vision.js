
import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const router = express.Router();

/**
 * 1️⃣ File Upload Config (5MB limit)
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * 2️⃣ Gemini Setup
 */
if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Upgrade to the current 2.5-flash generation for best performance and quota
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

/**
 * 3️⃣ Zod Validation Schema
 * We use the comprehensive schema suggested, but mapping to frontend fields later.
 */
const ExtractionSchema = z.object({
    jobNumber: z.string().nullable(),
    customerName: z.string().nullable(),
    customerMobileNo: z.string().nullable(),
    customerEmail: z.string().nullable(),
    item: z.string().nullable(),
    make: z.string().nullable(),
    model: z.string().nullable(),
    serialNumber: z.string().nullable(),
    date: z.string().nullable(),
    accessories: z.object({
        powerAdapter: z.boolean().default(false),
        powerCord: z.boolean().default(false),
        carryCase: z.boolean().default(false),
        battery: z.boolean().default(false),
        others: z.string().nullable(),
    }).optional(),
    remarks: z.string().nullable(),
    handwrittenNotes: z.string().nullable(),
});

/**
 * 4️⃣ POST /api/vision/extract
 */
router.post("/extract", upload.single("image"), async (req, res) => {
    try {
        let imageBuffer;
        let mimeType = "image/jpeg";

        console.log("Vision extraction request received.");

        // Handle multipart file
        if (req.file) {
            imageBuffer = req.file.buffer;
            mimeType = req.file.mimetype;
        }
        // Handle base64 image
        else if (req.body.image) {
            let base64String = req.body.image;

            if (base64String.includes(",")) {
                const match = base64String.match(/^data:([^;]+);base64,/);
                if (match) mimeType = match[1];
                base64String = base64String.split(",")[1];
            }

            imageBuffer = Buffer.from(base64String, "base64");
        }
        else {
            return res.status(400).json({ error: "No image provided" });
        }

        console.log("Processing image of size:", Math.round(imageBuffer.length / 1024), "KB");

        /**
         * 5️⃣ Strong Controlled Prompt
         */
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

        /**
         * 6️⃣ Gemini Call
         */
        const result = await model.generateContent({
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
        console.log("Raw Gemini response:", rawText);

        /**
         * 7️⃣ Safe JSON Parse
         */
        let parsed;
        try {
            parsed = JSON.parse(rawText);
        } catch (err) {
            console.error("Invalid JSON from Gemini:", rawText);
            return res.status(500).json({
                error: "AI returned invalid JSON",
            });
        }

        /**
         * 8️⃣ Validate Structure
         */
        const validated = ExtractionSchema.safeParse(parsed);

        if (!validated.success) {
            console.error("Schema validation failed:", validated.error.format());
            return res.status(500).json({
                error: "AI response failed validation",
                details: validated.error.errors
            });
        }

        /**
         * 9️⃣ Success Response
         * We map the fields to a flat structure that the current frontend expects, 
         * while also providing the full structured data.
         */
        const data = validated.data;

        // Combining make and model for the "brand" field in the form
        const combinedBrand = [data.make, data.model].filter(Boolean).join(" ");

        return res.json({
            success: true,
            data: {
                ...data,
                brand: combinedBrand || data.item || "",
                phoneNumber: data.customerMobileNo || "",
            }
        });

    } catch (error) {
        console.error("Vision extraction error:", error);

        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File too large (max 5MB)" });
        }

        if (error.message?.includes("429") || error.message?.includes("Quota exceeded")) {
            return res.status(429).json({ error: "Gemini API quota exceeded. Please wait a moment or try again later." });
        }

        if (error.message?.includes("API_KEY_INVALID")) {
            return res.status(500).json({ error: "Invalid Gemini API key" });
        }

        return res.status(500).json({
            error: "Vision extraction service failure: " + error.message,
        });
    }
});

export default router;