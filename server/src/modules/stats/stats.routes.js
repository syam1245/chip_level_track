import express from "express";
import StatsController from "./stats.controller.js";
import { requirePermission } from "../auth/auth.middleware.js";

const router = express.Router();

// All stats endpoints require admin access
router.use(requirePermission("admin:access"));

router.get("/revenue", StatsController.getRevenueReport);
router.get("/summary", StatsController.getSummary);

export default router;
