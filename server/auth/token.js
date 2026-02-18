import crypto from "crypto";

const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 8;

const base64UrlEncode = (value) => Buffer.from(value).toString("base64url");
const base64UrlDecode = (value) => Buffer.from(value, "base64url").toString("utf-8");

const sign = (value, secret) => crypto.createHmac("sha256", secret).update(value).digest("base64url");

export function createAuthToken(payload, secret, expiresInSeconds = DEFAULT_TOKEN_TTL_SECONDS) {
  const safePayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(safePayload));
  const signature = sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false };
  }

  const [encodedPayload, givenSignature] = token.split(".");
  const expectedSignature = sign(encodedPayload, secret);

  const givenBuffer = Buffer.from(givenSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (givenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(givenBuffer, expectedBuffer)) {
    return { valid: false };
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return { valid: false };
  }

  return { valid: true, payload };
}
