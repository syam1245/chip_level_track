import express from "express";
import StatsController from "./stats.controller.js";
import { requirePermission } from "../auth/auth.middleware.js";

// requireAuth and requireCsrf are already applied to all /api/stats routes
// at the app level in app.js: app.use("/api/stats", requireAuth, requireCsrf, statsRoutes)
// Repeating requireAuth here would run it twice on every request — removed.
// requirePermission("admin:access") is the only additional guard needed here.
const router = express.Router();

router.get("/revenue", requirePermission("admin:access"), StatsController.getRevenueReport);

export default router;