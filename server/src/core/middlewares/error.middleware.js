import logger from "../utils/logger.js";
import config from "../config/index.js";

const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (config.isProduction) {
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                success: false,
                status: err.status,
                message: err.message,
            });
        }

        // Programming or other unknown error: don't leak error details
        logger.error("🔥 CRITICAL ERROR:", err);
        return res.status(500).json({
            success: false,
            status: "error",
            message: "Something went very wrong!",
        });
    } else {
        // Development: send details
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err,
        });
    }
};

export default errorMiddleware;
