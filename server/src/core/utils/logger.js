import winston from "winston";
import config from "../config/index.js";

// In development, log at 'http' level so morgan access logs are visible.
// In production, log at 'info' (http is a lower priority level that also passes through).
const LOG_LEVEL = config.isProduction ? "info" : "http";

const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: "chip-level-track-backend" },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                    (info) => `${info.timestamp} ${info.level}: ${info.message}`
                )
            ),
        }),
    ],
});

// In production, also write structured JSON logs to a file for persistence / audit.
if (config.isProduction) {
    logger.add(
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 10 * 1024 * 1024, // 10 MB per file
            maxFiles: 5,
        })
    );
    logger.add(
        new winston.transports.File({
            filename: "logs/combined.log",
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
        })
    );
}

export default logger;
