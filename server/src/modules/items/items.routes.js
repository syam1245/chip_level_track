import express from "express";
import ItemController from "./items.controller.js";
import { requirePermission, requireAuth, requireCsrf } from "../auth/auth.middleware.js";
import { registerClient } from "./items.events.js";

const router = express.Router();

// Public route FIRST
router.get("/track", ItemController.trackItem); // Public tracking endpoint

// SSE live-events stream — auth required, no CSRF (GET stream)
router.get("/events", requireAuth, (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering if behind proxy
    res.flushHeaders();

    // Send a heartbeat every 20s to keep the connection alive through proxies
    const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 20_000);
    req.on("close", () => clearInterval(heartbeat));

    registerClient(res);
});

// Apply auth to all subsequent routes
router.use(requireAuth, requireCsrf);

// Static routes
router.get("/backup", requirePermission("items:backup"), ItemController.getBackup);
router.patch("/bulk-status", requirePermission("items:update"), ItemController.bulkUpdateStatus);
router.post("/", requirePermission("items:create"), ItemController.createItem);
router.get("/", requirePermission("items:read"), ItemController.getAllItems);

// Parameterised routes
router.put("/:id", requirePermission("items:update"), ItemController.updateItem);
router.delete("/:id", requirePermission("items:delete"), ItemController.deleteItem);

export default router;

