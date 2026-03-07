import mongoose from "mongoose";
import dns from "dns";
import { seedUsers } from "./seed.js";
import config from "./index.js";
import logger from "../utils/logger.js";

// Optional DNS override for SRV issues in dev environments
if (config.env !== "production") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

// Global cache (prevents multiple connections in hot reload / serverless)
global.__mongoose ||= { conn: null, promise: null };
const cached = global.__mongoose;

if (!config.mongodbUri) {
  throw new Error("MONGODB_URI must be configured.");
}

const connectDB = async () => {
  if (cached.conn) {
    logger.info("✅ Using cached MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 2,
    };

    cached.promise = mongoose
      .connect(config.mongodbUri, opts)
      .then((mongooseInstance) => {
        logger.info("✅ New MongoDB connection established");
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;

    // Seed default users safely
    await seedUsers().catch((err) => {
      logger.warn("User seed skipped:", err.message);
    });

  } catch (err) {
    cached.promise = null;
    logger.error("❌ MongoDB initial connection error:", err.message);
    process.exit(1);
  }

  return cached.conn;
};

// Connection lifecycle logs
mongoose.connection.on("connected", () => {
  logger.info("🔗 MongoDB connected");
});

mongoose.connection.on("reconnected", () => {
  logger.info("♻️ MongoDB reconnected");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("⚠️ MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error("❌ MongoDB runtime error:", err);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed on app termination");
  process.exit(0);
});

export default connectDB;