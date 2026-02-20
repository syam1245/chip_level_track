import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { applySecurity } from "./core/middlewares/security.middleware.js";
import { attachAuth, requireAuth, requireCsrf } from "./modules/auth/auth.middleware.js";
import errorMiddleware from "./core/middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import itemsRoutes from "./modules/items/items.routes.js";
import visionRoutes from "./modules/vision/vision.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security stack
applySecurity(app);

// Auth attachment
app.use(attachAuth);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", requireAuth, requireCsrf, itemsRoutes);
app.use("/api/vision", requireAuth, requireCsrf, visionRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Static assets
const clientBuildPath = path.join(__dirname, "../../client/build");
app.use(express.static(clientBuildPath));
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
});

// Global Error Handler
app.use(errorMiddleware);

export default app;
