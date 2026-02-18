import jwt from "jsonwebtoken";

const DEFAULT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const EXPIRES_IN = "8h";

export function createAuthToken(payload, secret = DEFAULT_SECRET) {
  return jwt.sign(payload, secret, { expiresIn: EXPIRES_IN });
}

export function verifyAuthToken(token, secret = DEFAULT_SECRET) {
  try {
    const payload = jwt.verify(token, secret);
    return { valid: true, payload };
  } catch (err) {
    return { valid: false };
  }
}
