import "dotenv/config";
import connectDB from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

if (!process.env.AUTH_TOKEN_SECRET) {
  throw new Error("AUTH_TOKEN_SECRET must be configured.");
}

let server;

connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`🚀 Production Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Critical DB Error:", err);
    process.exit(1);
  });

const gracefulShutdown = async (signal) => {
  console.info(`${signal} received. Closing HTTP server...`);
  if (server) {
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        const mongoose = (await import("mongoose")).default;
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
      } catch (err) {
        console.error("Error closing MongoDB connection:", err);
      }
      process.exit(0);
    });
  } else {
    try {
      const mongoose = (await import("mongoose")).default;
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
