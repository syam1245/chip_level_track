import jwt from "jsonwebtoken";
import config from "../../core/config/index.js";

const EXPIRES_IN = "8h";

export function createAuthToken(payload) {
    return jwt.sign(payload, config.authTokenSecret, { expiresIn: EXPIRES_IN });
}

export function verifyAuthToken(token) {
    try {
        const payload = jwt.verify(token, config.authTokenSecret);
        return { valid: true, payload };
    } catch (err) {
        return { valid: false };
    }
}
