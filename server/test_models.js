import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // There is no direct listModels in the main SDK class usually, 
        // but we can try to hit the endpoint or use the management client if available.
        // However, the easiest way to test a model is to try a simple health check tip.

        const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro-vision", "gemini-2.0-flash"];

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("test");
                console.log(`✅ Model ${modelName} is available.`);
            } catch (err) {
                console.log(`❌ Model ${modelName} failed: ${err.message}`);
            }
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
