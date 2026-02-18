import crypto from "crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { verifyPassword, hashPassword } from "../auth/password.js";
import { createAuthToken } from "../auth/token.js";
import { attachAuth, clearAuthCookies, requireAuth, setAuthCookies, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

// GET /api/auth/users - List users for the login dropdown
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "username displayName role").sort({ username: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const csrfToken = crypto.randomBytes(24).toString("hex");
    const token = createAuthToken({
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      csrfToken,
    });

    setAuthCookies(res, token, csrfToken);

    return res.json({
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      csrfToken,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error during login" });
  }
});

router.post("/logout", attachAuth, (_req, res) => {
  clearAuthCookies(res);
  return res.status(204).send();
});

router.get("/session", attachAuth, requireAuth, (req, res) => {
  res.json({
    username: req.user.username,
    role: req.user.role,
    displayName: req.user.displayName,
    csrfToken: req.user.csrfToken,
  });
});

// ADMIN ONLY: Update technician password
router.put("/users/:username/password", attachAuth, requireAuth, requirePermission("admin:access"), async (req, res) => {
  const { newPassword } = req.body;
  const { username } = req.params;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({ message: `Password updated for ${username}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update password" });
  }
});

export default router;
