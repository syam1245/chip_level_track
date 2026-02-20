import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import itemsRouter from "./routes/items.js";
import authRouter from "./routes/auth.js";
import visionRouter from "./routes/vision.js";
import { applySecurity } from "./appSecurity.js";
import { attachAuth, requireAuth, requireCsrf } from "./middleware/auth.js";

const app = express();
app.set("trust proxy", 1); // Trust first hop proxy (Render/AWS)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

applySecurity(app);
app.use(attachAuth);

app.use("/api/auth", authRouter);
app.use("/api/items", requireAuth, requireCsrf, itemsRouter);
app.use("/api/vision", requireAuth, requireCsrf, visionRouter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const clientBuildPath = path.join(__dirname, "../client/build");
app.use(express.static(clientBuildPath));
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// Global Error Handler - MUST be defined AFTER all routes
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  if (statusCode === 500) console.error("🔥 Server Error:", err);
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal error" : err.message,
  });
});

export default app;
