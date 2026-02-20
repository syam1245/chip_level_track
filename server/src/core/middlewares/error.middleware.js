import logger from "../utils/logger.js";
import config from "../config/index.js";

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return { message, statusCode: 400 };
};

const handleDuplicateFieldsDB = (err) => {
    let value = "Unknown";
    if (err.keyValue) {
        value = Object.values(err.keyValue).join(", ");
    } else if (err.errmsg) {
        const match = err.errmsg.match(/(["'])(?:(?!\1)[^\\]|\\.)*\1/);
        value = match ? match[0] : "Unknown";
    }
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return { message, statusCode: 400 };
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return { message, statusCode: 400 };
};

const errorMiddleware = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;
    error.status = err.status || "error";

    if (err.name === "CastError") {
        const { message, statusCode } = handleCastErrorDB(err);
        error.message = message;
        error.statusCode = statusCode;
        error.isOperational = true;
    }
    if (err.code === 11000) {
        const { message, statusCode } = handleDuplicateFieldsDB(err);
        error.message = message;
        error.statusCode = statusCode;
        error.isOperational = true;
    }
    if (err.name === "ValidationError") {
        const { message, statusCode } = handleValidationErrorDB(err);
        error.message = message;
        error.statusCode = statusCode;
        error.isOperational = true;
    }

    if (config.isProduction) {
        if (error.isOperational) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message, // Map message to error for legacy compatibility
            });
        }

        logger.error("🔥 CRITICAL ERROR:", err);
        return res.status(500).json({
            success: false,
            error: "Something went very wrong!",
        });
    } else {
        // Development: send details
        return res.status(error.statusCode).json({
            success: false,
            error: error.message, // Frontend expect 'error' string
            message: error.message,
            stack: err.stack,
            details: err,
        });
    }
};

export default errorMiddleware;
