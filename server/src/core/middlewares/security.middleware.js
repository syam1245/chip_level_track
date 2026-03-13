import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import config from "../config/index.js";
import AppError from "../errors/AppError.js";

// ── NoSQL injection sanitizer ─────────────────────────────────────────────────
// Strips MongoDB operator keys ($where, $gt, etc.), dot-notation keys (a.b),
// and prototype-poisoning keys (__proto__, constructor, prototype) from any
// parsed request object before it reaches route handlers.
function deepSanitize(obj) {
    if (!obj || typeof obj !== "object") return;

    for (const key of Object.keys(obj)) {
        if (
            key.startsWith("$") ||
            key.includes(".") ||
            key === "__proto__" ||
            key === "constructor" ||
            key === "prototype"
        ) {
            delete obj[key];
            continue;
        }
        if (typeof obj[key] === "object" && obj[key] !== null) {
            deepSanitize(obj[key]);
        }
    }
}

export const applySecurity = (app) => {
    // Trust the first proxy hop on Render (required for accurate req.ip and
    // rate limiting by real client IP, not the proxy's IP).
    if (config.isProduction) {
        app.set("trust proxy", 1);
    }

    // ── CORS ──────────────────────────────────────────────────────────────
    // Supports multiple allowed origins via comma-separated CORS_ORIGIN env var.
    const allowedOrigins = config.security.corsOrigin
        .split(",")
        .map((o) => o.trim().replace(/\/$/, ""));

    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || config.security.corsOrigin === "*") {
                return callback(null, true);
            }
            const normalizedOrigin = origin.replace(/\/$/, "");
            if (allowedOrigins.includes(normalizedOrigin)) {
                return callback(null, true);
            }
            return callback(
                new AppError(`CORS Policy Violation: Origin ${origin} not allowed.`, 403)
            );
        },
        credentials: true,
        optionsSuccessStatus: 200,
    }));

    // ── Rate limiting ─────────────────────────────────────────────────────
    const limiter = rateLimit({
        windowMs: config.security.rateLimitWindowMs,
        limit: 300,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        message: { success: false, message: "Too many requests." },
    });

    app.use("/api/", limiter);

    // ── Helmet CSP ────────────────────────────────────────────────────────
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc:  ["'self'"],
                scriptSrc:   ["'self'"],
                styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc:     ["'self'", "https://fonts.gstatic.com", "data:"],
                imgSrc:      ["'self'", "data:", "blob:"],
                connectSrc:  ["'self'", "https://generativelanguage.googleapis.com"],
                mediaSrc:    ["'self'", "blob:"],
                frameAncestors: ["'none'"],
                formAction:  ["'self'"],
                upgradeInsecureRequests: config.isProduction ? [] : null,
            },
            reportOnly: false,
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    }));

    // ── Compression ───────────────────────────────────────────────────────
    app.use(compression({ level: 6, threshold: 1024 }));

    // ── Body parsing ──────────────────────────────────────────────────────
    // 10mb limit accommodates base64 image uploads for the vision OCR feature.
    // Regular CRUD payloads are tiny — the vision controller enforces its own
    // 5mb limit on top of this for the upload endpoint specifically.
    app.use(express.json({ limit: "10mb", strict: true }));
    app.use(express.urlencoded({ extended: false, limit: "10mb" }));

    // ── NoSQL injection sanitization ──────────────────────────────────────
    app.use((req, _res, next) => {
        if (req.body)   deepSanitize(req.body);
        if (req.params) deepSanitize(req.params);
        if (req.query)  deepSanitize(req.query);
        next();
    });
};