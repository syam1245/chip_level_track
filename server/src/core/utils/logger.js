import winston from "winston";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config/index.js";

// In development, log at 'http' so morgan access logs are visible.
// In production, log at 'info' (http is lower priority and passes through info).
const LOG_LEVEL = config.isProduction ? "info" : "http";

// ── Shared base format (timestamp + error stack unpacking + splat) ────────────
// errors({ stack: true }) must come before splat/json — it unpacks Error objects
// and puts the stack trace on info.stack where printf and json() can reach it.
const baseFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
);

// ── Console format ────────────────────────────────────────────────────────────
// Original printf only printed info.message:
//   - Stack traces live on info.stack — were silently dropped
//   - Extra metadata args (logger.warn("msg", { key: val })) were silently dropped
const consoleFormat = winston.format.combine(
    baseFormat,
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, stack, service: _service, ...meta }) => {
        // Append any extra metadata (omit the service tag — too noisy for console)
        const extras = Object.keys(meta).length
            ? ` ${JSON.stringify(meta)}`
            : "";
        // Append stack trace when present (logger.error(new Error(...)))
        const trace = stack ? `\n${stack}` : "";
        return `${timestamp} ${level}: ${message}${extras}${trace}`;
    })
);

// ── File format — structured JSON for log aggregators ────────────────────────
const fileFormat = winston.format.combine(
    baseFormat,
    winston.format.json()
);

// ── Logger instance ───────────────────────────────────────────────────────────
const logger = winston.createLogger({
    level: LOG_LEVEL,
    defaultMeta: { service: "chip-level-track-backend" },
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
    ],
});

// ── Production file transports ────────────────────────────────────────────────
if (config.isProduction) {
    // logger.js lives at server/src/core/utils/logger.js
    // Three levels up (../../../) lands at server/ — correct root for logs/
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const logsDir = path.join(__dirname, "../../../logs");

    try {
        // Winston does NOT create missing directories — mkdirSync must run first.
        // Without this, the first log write in production throws ENOENT and
        // the process crashes silently since logger itself is what we use to
        // report errors.
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        logger.add(new winston.transports.File({
            filename:  path.join(logsDir, "error.log"),
            level:     "error",
            format:    fileFormat,
            maxsize:   10 * 1024 * 1024, // 10 MB
            maxFiles:  5,
            tailable:  true, // Keep base filename as the current log; rotate numbered copies
        }));

        logger.add(new winston.transports.File({
            filename:  path.join(logsDir, "combined.log"),
            format:    fileFormat,
            maxsize:   10 * 1024 * 1024,
            maxFiles:  5,
            tailable:  true,
        }));

    } catch (err) {
        // Log directory creation failed — fall back to console-only rather
        // than crashing the entire app over a logging concern.
        console.error("[logger] Could not create logs directory, using console only:", err.message);
    }
}

export default logger;