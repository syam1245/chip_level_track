import express from "express";
import rateLimit from "express-rate-limit";
import AuthController from "./auth.controller.js";
import { requireAuth, requireCsrf } from "./auth.middleware.js";

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: "Too many login attempts. Try again later." },
});

const technicianLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests." },
});

// NOTE: attachAuth is applied globally in app.js — no need to repeat it here.
router.get("/users", requireAuth, AuthController.getUsers);
router.post("/users", requireAuth, requireCsrf, AuthController.createUser);
router.get("/technicians", technicianLimiter, AuthController.getTechnicianNames);
router.post("/login", loginLimiter, AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/session", requireAuth, AuthController.getSession);

// ADMIN: Update technician password (any authenticated user, controller enforces role)
router.put("/users/:username/password", requireAuth, requireCsrf, AuthController.updatePassword);

// ADMIN: Toggle technician active status
router.put("/users/:username/active", requireAuth, requireCsrf, AuthController.toggleActive);

// ADMIN: Hard Delete User (requires Admin Password verification)
router.delete("/users/:username", requireAuth, requireCsrf, AuthController.deleteUser);

// ADMIN: Update user profile (username/display name)
router.put("/users/:username", requireAuth, requireCsrf, AuthController.updateUser);

export default router;
