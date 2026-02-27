import "dotenv/config";

const config = {
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    mongodbUri: process.env.MONGODB_URI,
    authTokenSecret: process.env.AUTH_TOKEN_SECRET,
    geminiApiKey: process.env.GEMINI_API_KEY,
    // Model name is configurable so updates don't require code changes
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
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

// Warn loudly if running in production with a wide-open CORS policy
if (config.isProduction && config.security.corsOrigin === "*") {
    console.warn("[SECURITY WARNING] CORS_ORIGIN is set to '*' in production. Set it to your exact frontend origin.");
}

export default config;
