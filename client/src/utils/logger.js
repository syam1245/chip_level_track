/**
 * Lightweight client-side logger.
 *
 * Centralizes all console output so it's easy to:
 *  - Silence in production (flip the IS_DEV check)
 *  - Pipe to Sentry / OpenTelemetry later
 *  - Grep for usage across the codebase
 *
 * Usage:
 *   import { logger } from "../utils/logger";
 *   logger.error("Failed to fetch", { status: 500 });
 *   logger.warn("Retry exhausted");
 *   logger.info("Connected to SSE");
 */

const IS_DEV = import.meta.env.MODE !== "production";

export const logger = {
    /** Always logged — errors should surface in every environment. */
    error: (msg, ...meta) => {
        console.error(`[ERROR] ${msg}`, ...meta);
    },

    /** Warnings — logged in all environments. */
    warn: (msg, ...meta) => {
        console.warn(`[WARN] ${msg}`, ...meta);
    },

    /** Informational — dev only, silenced in production builds. */
    info: (msg, ...meta) => {
        if (IS_DEV) console.log(`[INFO] ${msg}`, ...meta);
    },

    /** Debug — dev only, verbose detail. */
    debug: (msg, ...meta) => {
        if (IS_DEV) console.debug(`[DEBUG] ${msg}`, ...meta);
    },
};
