import express from "express";
import StatsController from "./stats.controller.js";
import { requireAuth, requirePermission } from "../auth/auth.middleware.js";

const router = express.Router();

router.get("/revenue", requireAuth, requirePermission("admin:access"), StatsController.getRevenueReport);

export default router;
