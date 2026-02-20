import express from "express";
import rateLimit from "express-rate-limit";
import AuthController from "./auth.controller.js";
import { attachAuth, requireAuth, requirePermission } from "./auth.middleware.js";

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many login attempts. Try again later." },
});

router.get("/users", AuthController.getUsers);
router.post("/login", loginLimiter, AuthController.login);
router.post("/logout", attachAuth, AuthController.logout);
router.get("/session", attachAuth, requireAuth, AuthController.getSession);

// ADMIN ONLY: Update technician password
router.put(
    "/users/:username/password",
    attachAuth,
    requireAuth,
    requirePermission("admin:access"),
    AuthController.updatePassword
);

export default router;
