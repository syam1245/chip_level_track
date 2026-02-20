import express from "express";
import ItemController from "./items.controller.js";
import { requirePermission } from "../auth/auth.middleware.js";

const router = express.Router();

router.get("/backup", requirePermission("items:backup"), ItemController.getBackup);
router.post("/", requirePermission("items:create"), ItemController.createItem);
router.put("/:id", requirePermission("items:update"), ItemController.updateItem);
router.get("/", requirePermission("items:read"), ItemController.getAllItems);
router.delete("/:id", requirePermission("items:delete"), ItemController.deleteItem);

export default router;
