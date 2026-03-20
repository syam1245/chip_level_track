import express from "express";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { applySecurity } from "./core/middlewares/security.middleware.js";
import { attachAuth, requireAuth, requireCsrf } from "./modules/auth/auth.middleware.js";
import errorMiddleware from "./core/middlewares/error.middleware.js";
import httpLogger from "./core/middlewares/httpLogger.middleware.js";
import { requestIdMiddleware } from "./core/middlewares/audit.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import itemsRoutes from "./modules/items/items.routes.js";
import statsRoutes from "./modules/stats/stats.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Security stack (Helmet, CORS, rate-limit, body parsing, sanitization) ────
applySecurity(app);

// ── Request ID attribution ───────────────────────────────────────────────────
app.use(requestIdMiddleware);

// ── HTTP access logging ───────────────────────────────────────────────────────
app.use(httpLogger);

// ── Auth attachment (sets req.user — does NOT reject unauthenticated requests) 
app.use(attachAuth);

// ── Health check ──────────────────────────────────────────────────────────────
// Placed before static middleware so it is always matched by the router first.
// Returns DB state so monitoring tools get accurate signal — not just process liveness.
// mongoose.connection.readyState: 0=disconnected 1=connected 2=connecting 3=disconnecting
app.get("/api/health", (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbConnected = dbState === 1;

    if (!dbConnected) {
        return res.status(503).json({
            status: "degraded",
            db: "disconnected",
        });
    }

    res.json({ status: "OK", db: "connected" });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",  authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/stats", requireAuth, requireCsrf, statsRoutes);
app.use("/api/ai",    requireAuth, requireCsrf, aiRoutes);

// ── 404 handler for unmatched /api/* routes ───────────────────────────────────
// Without this, Express returns its default plaintext "Cannot GET /api/xyz"
// response. Every other error in this app returns structured JSON — this
// ensures unmatched API routes do too.
app.use("/api/*path", (req, res) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// ── Static assets + SPA fallback ─────────────────────────────────────────────
const clientBuildPath = path.join(__dirname, "../../client/build");
app.use(express.static(clientBuildPath));
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorMiddleware);

export default app;
