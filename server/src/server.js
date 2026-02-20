import mongoose from "mongoose";
import config from "./core/config/index.js";
import logger from "./core/utils/logger.js";
import connectDB from "./core/config/db.js";
import app from "./app.js";

const PORT = config.port;

let server;

connectDB().then(() => {
    server = app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT} in ${config.env} mode`);
    });
});

const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Closing HTTP server...`);
    if (server) {
        server.close(async () => {
            logger.info("HTTP server closed.");
            try {
                await mongoose.connection.close();
                logger.info("MongoDB connection closed.");
                process.exit(0);
            } catch (err) {
                logger.error("Error closing MongoDB connection:", err);
                process.exit(1);
            }
        });
    } else {
        process.exit(0);
    }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
    logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
    logger.error(err.name, err.message);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    logger.error(err.name, err.message);
    process.exit(1);
});
