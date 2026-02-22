import express from "express";
import StatsController from "./stats.controller.js";
import { requirePermission } from "../auth/auth.middleware.js";

const router = express.Router();

router.get("/revenue", StatsController.getRevenueReport);

export default router;
