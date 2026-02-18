import crypto from "crypto";
import { verifyAuthToken } from "../auth/token.js";
import { ROLE_PERMISSIONS } from "../constants/roles.js";

const AUTH_COOKIE_NAME = "chip_auth";
const CSRF_COOKIE_NAME = "chip_csrf";

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const [rawKey, ...rest] = pair.split("=");
      if (!rawKey) return acc;
      acc[rawKey] = decodeURIComponent(rest.join("="));
      return acc;
    }, {});
}

export function attachAuth(req, res, next) {
  req.cookies = parseCookies(req.headers.cookie);
  req.user = null;

  const token = req.cookies[AUTH_COOKIE_NAME];
  const secret = process.env.AUTH_TOKEN_SECRET;

  if (token && secret) {
    const verified = verifyAuthToken(token, secret);
    if (verified.valid) {
      req.user = {
        username: verified.payload.username,
        role: verified.payload.role,
        displayName: verified.payload.displayName,
        csrfToken: verified.payload.csrfToken,
      };
    }
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}

export function requirePermission(permission) {
  return (req, res, next) => {
    const role = req.user?.role;
    const allowedPermissions = role ? ROLE_PERMISSIONS[role] || [] : [];

    if (!allowedPermissions.includes(permission)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}

export function requireCsrf(req, res, next) {
  const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
  if (safeMethods.has(req.method)) {
    return next();
  }

  const csrfHeader = req.headers["x-csrf-token"];
  const csrfCookie = req.cookies[CSRF_COOKIE_NAME];
  const expected = req.user?.csrfToken;

  if (!csrfHeader || !csrfCookie || !expected) {
    return res.status(403).json({ error: "CSRF validation failed" });
  }

  const headerBuffer = Buffer.from(String(csrfHeader));
  const expectedBuffer = Buffer.from(String(expected));
  const cookieBuffer = Buffer.from(String(csrfCookie));

  const headerMatches = headerBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(headerBuffer, expectedBuffer);
  const cookieMatches = cookieBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(cookieBuffer, expectedBuffer);

  if (!headerMatches || !cookieMatches) {
    return res.status(403).json({ error: "CSRF validation failed" });
  }

  return next();
}

export function setAuthCookies(res, token, csrfToken) {
  const secure = process.env.NODE_ENV === "production";
  const maxAge = 8 * 60 * 60 * 1000;

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge,
  });

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}

export function clearAuthCookies(res) {
  const secure = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
  };

  res.clearCookie(AUTH_COOKIE_NAME, options);
  res.clearCookie(CSRF_COOKIE_NAME, { ...options, httpOnly: false });
}
