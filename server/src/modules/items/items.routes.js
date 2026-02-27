import express from "express";
import ItemController from "./items.controller.js";
import { requirePermission } from "../auth/auth.middleware.js";

const router = express.Router();

// Static routes first — must precede /:id to avoid 'bulk-status' being matched as an ID
router.get("/backup", requirePermission("items:backup"), ItemController.getBackup);
router.patch("/bulk-status", requirePermission("items:update"), ItemController.bulkUpdateStatus);
router.post("/", requirePermission("items:create"), ItemController.createItem);
router.get("/", requirePermission("items:read"), ItemController.getAllItems);

// Parameterised routes
router.put("/:id", requirePermission("items:update"), ItemController.updateItem);
router.delete("/:id", requirePermission("items:delete"), ItemController.deleteItem);

export default router;
