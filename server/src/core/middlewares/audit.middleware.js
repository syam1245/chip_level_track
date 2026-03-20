import crypto from "crypto";
import logger from "../utils/logger.js";

/**
 * Middleware to generate a Request ID.
 * Should be placed early in the Express stack.
 */
export function requestIdMiddleware(req, res, next) {
    req.id = req.headers["x-request-id"] || crypto.randomUUID();
    res.setHeader("X-Request-ID", req.id);
    next();
}

/**
 * Creates an audit-logging middleware for specific routes.
 * 
 * @param {string} action - The normalized action name (e.g., "CREATE_ITEM", "UPDATE_STATUS")
 * @param {function} getResourceId - Optional function to extract the resource ID from the request
 * @returns {function} Express middleware
 */
export function auditLog(action, getResourceId = (req) => req.params.id || null) {
    return (req, res, next) => {
        // Wait for the request to finish to ensure we only log successful actions (or log failures properly)
        res.on("finish", () => {
            // Only log if the action succeeded (2xx or 3xx)
            if (res.statusCode >= 200 && res.statusCode < 400) {
                const resourceId = getResourceId(req) || (res.locals.resourceId || null);
                
                logger.info(`[AUDIT] ${action}`, {
                    audit: true,
                    userId: req.user?.username || "system",
                    action,
                    resourceId,
                    timestamp: new Date().toISOString(),
                    ip: req.ip || req.socket?.remoteAddress || "unknown",
                    userAgent: req.headers["user-agent"] || "unknown",
                    requestId: req.id,
                });
            }
        });
        next();
    };
}
