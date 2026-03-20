import express from "express";
import rateLimit from "express-rate-limit";
import ItemController from "./items.controller.js";
import { requirePermission, requireAuth, requireCsrf } from "../auth/auth.middleware.js";
import { registerClient, getClientCount } from "./items.events.js";

const router = express.Router();

const trackLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many tracking requests. Please try again shortly." },
});

const bulkLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many bulk mutation requests. Please try again shortly." },
});

const backupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many backup requests. Please try again later." },
});

const MAX_SSE_CLIENTS = 50;

// ── Public route — no auth ────────────────────────────────────────────────────
router.get("/track", trackLimiter, ItemController.trackItem);

// ── SSE live-events stream ────────────────────────────────────────────────────
// requireAuth but NOT requireCsrf — EventSource is a GET request and browsers
// cannot set custom headers on it, so CSRF token injection is not possible.
router.get("/events", requireAuth, (req, res) => {
    if (getClientCount() >= MAX_SSE_CLIENTS) {
        return res.status(503).json({ error: "Too many live connections. Try again later." });
    }

    res.setHeader("Content-Type",      "text/event-stream");
    res.setHeader("Cache-Control",     "no-cache");
    res.setHeader("Connection",        "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering for SSE
    res.flushHeaders();

    const heartbeat = setInterval(() => {
        // Wrap in try/catch — if the proxy suppresses req "close" event,
        // the interval keeps running and an uncaught write error to a dead
        // connection would crash the interval without cleanup.
        try {
            res.write(": heartbeat\n\n");
        } catch {
            clearInterval(heartbeat);
        }
    }, 20_000);

    // Force reconnect after 30 mins to avoid stale references on Render free tier
    const MAX_SSE_AGE_MS = 30 * 60 * 1000;
    const maxAgeTimer = setTimeout(() => {
        res.end();
    }, MAX_SSE_AGE_MS);

    req.on("close", () => {
        clearInterval(heartbeat);
        clearTimeout(maxAgeTimer);
    });

    registerClient(res);
});

// ── Apply auth + CSRF to all subsequent routes ────────────────────────────────
router.use(requireAuth, requireCsrf);

// Static named routes — must come before /:id to avoid being matched as a param
router.get("/backup",      backupLimiter, requirePermission("items:backup"), ItemController.getBackup);
router.patch("/bulk-status", bulkLimiter, requirePermission("items:update"), ItemController.bulkUpdateStatus);
router.patch("/bulk-delete", bulkLimiter, requirePermission("items:delete"), ItemController.bulkDeleteItems);
router.post("/",           requirePermission("items:create"), ItemController.createItem);
router.get("/",            requirePermission("items:read"),   ItemController.getAllItems);

// Parameterised routes — after all static routes
router.put("/:id",    requirePermission("items:update"), ItemController.updateItem);
router.delete("/:id", requirePermission("items:delete"), ItemController.deleteItem);

export default router;