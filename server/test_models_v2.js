import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const models = [
            "gemini-1.5-flash-8b",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-002",
            "gemini-1.5-pro-001",
            "gemini-1.0-pro-vision-latest"
        ];

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // Minimal request to test availability
                const result = await model.generateContent("hi");
                console.log(`✅ Model ${modelName} is available.`);
                break; // Stop if we find one that works!
            } catch (err) {
                console.log(`❌ Model ${modelName} failed: ${err.message}`);
            }
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
