import express from "express";
import rateLimit from "express-rate-limit";
import AuthController from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts toward the limit
    message: { error: "Too many login attempts. Try again later." },
});

// NOTE: attachAuth is applied globally in app.js — no need to repeat it here.
router.get("/users", requireAuth, AuthController.getUsers);
router.post("/users", requireAuth, AuthController.createUser); // ADMIN ONLY (enforced in controller)
router.get("/technicians", AuthController.getTechnicianNames); // Public: for login dropdown
router.post("/login", loginLimiter, AuthController.login);
router.post("/logout", AuthController.logout);           // attachAuth already ran globally
router.get("/session", requireAuth, AuthController.getSession);

// ADMIN: Update technician password (any authenticated user, controller enforces role)
router.put("/users/:username/password", requireAuth, AuthController.updatePassword);

// ADMIN: Toggle technician active status
router.put("/users/:username/active", requireAuth, AuthController.toggleActive);

// ADMIN: Hard Delete User (requires Admin Password verification)
router.delete("/users/:username", requireAuth, AuthController.deleteUser);

// ADMIN: Update user profile (username/display name)
router.put("/users/:username", requireAuth, AuthController.updateUser);

export default router;
