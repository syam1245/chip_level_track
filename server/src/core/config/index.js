import "dotenv/config";

const config = {
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    mongodbUri: process.env.MONGODB_URI,
    authTokenSecret: process.env.AUTH_TOKEN_SECRET,
    geminiApiKey: process.env.GEMINI_API_KEY,
    isProduction: process.env.NODE_ENV === "production",
    security: {
        corsOrigin: process.env.CORS_ORIGIN || "*",
        rateLimitWindowMs: 15 * 60 * 1000,
        rateLimitMax: 100,
    }
};

if (!config.authTokenSecret) {
    throw new Error("AUTH_TOKEN_SECRET must be configured.");
}

export default config;
