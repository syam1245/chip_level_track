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

const MAX_SSE_CLIENTS = 50;

// Public route FIRST
router.get("/track", trackLimiter, ItemController.trackItem);

// SSE live-events stream — auth required, no CSRF (GET stream)
router.get("/events", requireAuth, (req, res) => {
    if (getClientCount() >= MAX_SSE_CLIENTS) {
        return res.status(503).json({ error: "Too many live connections. Try again later." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 20_000);
    req.on("close", () => clearInterval(heartbeat));

    registerClient(res);
});

// Apply auth to all subsequent routes
router.use(requireAuth, requireCsrf);

// Static routes
router.get("/backup", requirePermission("items:backup"), ItemController.getBackup);
router.patch("/bulk-status", requirePermission("items:update"), ItemController.bulkUpdateStatus);
router.patch("/bulk-delete", requirePermission("items:delete"), ItemController.bulkDeleteItems);
router.post("/", requirePermission("items:create"), ItemController.createItem);
router.get("/", requirePermission("items:read"), ItemController.getAllItems);

// Parameterised routes
router.put("/:id", requirePermission("items:update"), ItemController.updateItem);
router.delete("/:id", requirePermission("items:delete"), ItemController.deleteItem);

export default router;

