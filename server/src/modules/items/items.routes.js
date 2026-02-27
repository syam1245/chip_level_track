import express from "express";
import ItemController from "./items.controller.js";
import { requirePermission, requireAuth, requireCsrf } from "../auth/auth.middleware.js";

const router = express.Router();

// Public route FIRST
router.get("/track", ItemController.trackItem); // Public tracking endpoint

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
