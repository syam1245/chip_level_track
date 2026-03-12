import mongoose from "mongoose";
import dns from "dns";
import config from "./index.js";
import logger from "../utils/logger.js";

// ── DNS override ─────────────────────────────────────────────────────────────
// Kept intentionally: some local/office networks fail to resolve MongoDB SRV
// records, requiring a forced fallback to Google's public DNS. Production uses
// the host's default DNS (Atlas handles it correctly there).
if (config.env !== "production") {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

// ── Connection options ───────────────────────────────────────────────────────
const MONGO_OPTS = {
    bufferCommands: false,         // fail immediately if not connected; don't queue ops silently
    serverSelectionTimeoutMS: 5000, // give up finding a server after 5s
    socketTimeoutMS: 45000,         // close sockets idle for 45s (catches stale Atlas free-tier connections)
    heartbeatFrequencyMS: 10000,    // check server health every 10s for faster reconnect detection
    maxPoolSize: 10,
    minPoolSize: 2,
};

// ── Simple connection state flag ─────────────────────────────────────────────
// Replaces the global.__mongoose caching pattern which is designed for
// serverless (Next.js / Lambda). In a long-running Express process, Mongoose
// manages its own connection pool internally — the global cache only adds
// complexity and a mutable global with no benefit.
let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        logger.info("✅ Using existing MongoDB connection");
        return;
    }

    try {
        await mongoose.connect(config.mongodbUri, MONGO_OPTS);
        // isConnected is set to true by the "connected" event listener below,
        // but we set it here as well so it's immediately accurate after await.
        isConnected = true;
    } catch (err) {
        logger.error("❌ MongoDB initial connection failed:", err.message);
        process.exit(1);
    }
};

// ── Connection lifecycle logs ────────────────────────────────────────────────
mongoose.connection.on("connected", () => {
    isConnected = true;
    logger.info("🔗 MongoDB connected");
});

mongoose.connection.on("reconnected", () => {
    isConnected = true;
    logger.info("♻️  MongoDB reconnected");
});

mongoose.connection.on("disconnected", () => {
    isConnected = false;
    logger.warn("⚠️  MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
    logger.error("❌ MongoDB runtime error:", err);
});

// Signal handling lives in server.js — it owns the full shutdown sequence
// (HTTP server close first, then DB). db.js must not register its own
// signal handlers or mongoose.connection.close() gets called twice.

export default connectDB;