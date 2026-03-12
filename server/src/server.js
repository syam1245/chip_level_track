import mongoose from "mongoose";
import config from "./core/config/index.js";
import logger from "./core/utils/logger.js";
import connectDB from "./core/config/db.js";
import { seedUsers } from "./core/config/seed.js";
import app from "./app.js";

const PORT = config.port;

let server;

// ── Startup sequence ──────────────────────────────────────────────────────────
// Using an async IIFE so the boot steps read as a linear sequence rather
// than nested .then() chains. Errors bubble to unhandledRejection below.
(async () => {
    await connectDB();

    // Seed runs after connection is confirmed. It no-ops if users already exist,
    // so it's safe to call on every startup — not just the first deploy.
    await seedUsers().catch((err) => {
        // Non-fatal: if seeding fails on a deploy where users already exist
        // (e.g. a transient DB error), the app should still start.
        // If seeding fails on a truly empty DB, technicians won't be able to
        // log in — the warning makes that visible in the logs.
        logger.warn("⚠️  User seeding skipped:", err.message);
    });

    server = app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT} in ${config.env} mode`);
    });
})();

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// Closes HTTP server first (stops accepting new requests), then closes the
// DB connection. Order matters — DB must not close while in-flight requests
// are still being handled.
// Handles both SIGTERM (sent by Render/Docker on deploy/stop) and
// SIGINT (Ctrl+C in local dev). db.js does NOT register its own signal
// handlers — this is the single owner of the shutdown sequence.
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
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

// ── Unhandled promise rejections ──────────────────────────────────────────────
// Catches rejected promises that slipped past asyncHandler — e.g. the startup
// IIFE above if connectDB throws.
process.on("unhandledRejection", (err) => {
    logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
    logger.error(err.name, err.message);
    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});

// ── Uncaught synchronous exceptions ──────────────────────────────────────────
// The process is in an undefined state after an uncaught exception —
// exit immediately rather than attempting graceful shutdown.
process.on("uncaughtException", (err) => {
    logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    logger.error(err.name, err.message);
    process.exit(1);
});