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

process.on("SIGTERM", () => {
  console.info("SIGTERM received. Closing HTTP server...");
  if (server) {
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  }
});
