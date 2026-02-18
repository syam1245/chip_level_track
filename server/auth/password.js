import crypto from "crypto";

const ITERATIONS = 210000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(plainPassword, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto
    .pbkdf2Sync(plainPassword, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString("hex");

  return `${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(plainPassword, storedHash) {
  const [iterationsRaw, salt, originalHash] = String(storedHash).split(":");
  const iterations = Number.parseInt(iterationsRaw, 10);

  if (!iterations || !salt || !originalHash) return false;

  const candidate = crypto
    .pbkdf2Sync(plainPassword, salt, iterations, KEY_LENGTH, DIGEST)
    .toString("hex");

  const originalBuffer = Buffer.from(originalHash, "hex");
  const candidateBuffer = Buffer.from(candidate, "hex");

  if (originalBuffer.length !== candidateBuffer.length) return false;

  return crypto.timingSafeEqual(originalBuffer, candidateBuffer);
}
