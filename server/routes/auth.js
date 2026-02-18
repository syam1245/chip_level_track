import crypto from "crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import { PREDEFINED_USERS } from "../config/predefinedUsers.js";
import { verifyPassword } from "../auth/password.js";
import { createAuthToken } from "../auth/token.js";
import { attachAuth, clearAuthCookies, requireAuth, setAuthCookies } from "../middleware/auth.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

router.post("/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = PREDEFINED_USERS.find((entry) => entry.username === username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const csrfToken = crypto.randomBytes(24).toString("hex");
  const token = createAuthToken(
    {
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      csrfToken,
    },
    process.env.AUTH_TOKEN_SECRET,
  );

  setAuthCookies(res, token, csrfToken);

  return res.json({
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    csrfToken,
  });
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

export default router;
