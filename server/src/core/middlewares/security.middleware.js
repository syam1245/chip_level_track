import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import config from "../config/index.js";

function deepSanitize(obj) {
    if (!obj || typeof obj !== "object" || obj === null) return;

    for (const key of Object.keys(obj)) {
        if (key.startsWith("$") || key.includes(".") || key === "__proto__") {
            delete obj[key];
            continue;
        }
        if (typeof obj[key] === "object" && obj[key] !== null) {
            deepSanitize(obj[key]);
        }
    }
}

export const applySecurity = (app) => {
    if (config.isProduction) {
        app.set("trust proxy", 1);
    }

    const limiter = rateLimit({
        windowMs: config.security.rateLimitWindowMs,
        limit: config.security.rateLimitMax * 10, // Global limit is higher
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { success: false, message: "Too many requests." },
    });

    app.use("/api/", limiter);

    app.use(helmet({
        contentSecurityPolicy: undefined,
        crossOriginEmbedderPolicy: false,
    }));

    app.use(compression({ level: 6, threshold: 1024 }));

    const allowedOrigins = config.security.corsOrigin.split(",");
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || config.security.corsOrigin === "*" || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("CORS Policy Violation"));
        },
        credentials: true,
    }));

    app.use(express.json({ limit: "10mb", strict: true }));
    app.use(express.urlencoded({ extended: false, limit: "10mb" }));

    app.use((req, res, next) => {
        if (req.body) deepSanitize(req.body);
        if (req.params) deepSanitize(req.params);
        if (req.query) deepSanitize(req.query);
        next();
    });
};
