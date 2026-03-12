import logger from "../utils/logger.js";
import config from "../config/index.js";

// ── MongoDB error normalizers ──────────────────────────────────────────────────

const handleCastErrorDB = (err) => ({
    message: `Invalid ${err.path}: ${err.value}.`,
    statusCode: 400,
});

const handleDuplicateFieldsDB = (err) => {
    let value = "Unknown";
    if (err.keyValue && typeof err.keyValue === "object") {
        // Modern MongoDB driver — keyValue is always { field: value }
        value = Object.entries(err.keyValue)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
    } else if (err.errmsg) {
        // Legacy fallback — parse quoted value from errmsg string
        try {
            const match = err.errmsg.match(/(["'])(?:(?!\1)[^\\]|\\.)*\1/);
            value = match ? match[0] : "Unknown";
        } catch { /* regex failed, keep "Unknown" */ }
    }
    return {
        message: `Duplicate field value: ${value}. Please use another value!`,
        statusCode: 400,
    };
};

const handleValidationErrorDB = (err) => ({
    message: `Invalid input data. ${Object.values(err.errors).map((e) => e.message).join(". ")}`,
    statusCode: 400,
});

// JWT errors are normal operational events (expired session, tampered token).
// Without explicit handling they fall through to the generic 500 path and
// return "Something went very wrong!" in production — wrong severity entirely.
const handleJWTError = () => ({
    message: "Invalid or expired session. Please log in again.",
    statusCode: 401,
});

// ── Error middleware ───────────────────────────────────────────────────────────
// Express identifies error middleware by the 4-argument signature.
// _next is required by Express but intentionally unused here.
const errorMiddleware = (err, req, res, _next) => {
    // Do NOT spread Error objects — message, stack, name are non-enumerable and
    // won't copy. Work with err directly and build a clean response object.
    let statusCode  = err.statusCode  || 500;
    let status      = err.status      || "error";
    let message     = err.message     || "Something went wrong";
    let isOperational = err.isOperational || false;

    // ── Normalize known error types ────────────────────────────────────────
    if (err.name === "CastError") {
        ({ message, statusCode } = handleCastErrorDB(err));
        isOperational = true;
    } else if (err.code === 11000) {
        ({ message, statusCode } = handleDuplicateFieldsDB(err));
        isOperational = true;
    } else if (err.name === "ValidationError") {
        ({ message, statusCode } = handleValidationErrorDB(err));
        isOperational = true;
    } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        ({ message, statusCode } = handleJWTError());
        isOperational = true;
    }

    status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // ── Logging ────────────────────────────────────────────────────────────
    if (isOperational) {
        // Operational errors (bad input, duplicate keys, expired tokens) are
        // logged at warn — expected events, useful for spotting abuse patterns.
        logger.warn(`[${statusCode}] ${req.method} ${req.originalUrl} — ${message}`);
    } else {
        // Non-operational errors are unexpected bugs — log full detail.
        logger.error("🔥 CRITICAL ERROR:", {
            message: err.message,
            stack:   err.stack,
            url:     req.originalUrl,
            method:  req.method,
        });
    }

    // ── Response ───────────────────────────────────────────────────────────
    if (config.isProduction) {
        if (isOperational) {
            return res.status(statusCode).json({
                success: false,
                error: message,
            });
        }
        return res.status(500).json({
            success: false,
            error: "Something went very wrong!",
        });
    }

    // Development: include stack for debugging
    return res.status(statusCode).json({
        success: false,
        status,
        error: message,
        stack: err.stack,
    });
};

export default errorMiddleware;