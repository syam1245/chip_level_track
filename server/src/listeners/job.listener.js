import { eventBus, EVENTS } from "../core/events/eventBus.js";
import { broadcast } from "../modules/items/items.events.js";
import logger from "../core/utils/logger.js";

/**
 * Listener for Job-related real-time Server-Sent Events (SSE).
 */
export function registerJobListeners() {
    eventBus.on(EVENTS.JOB_CREATED, (payload) => {
        logger.info("[DOMAIN EVENT] JOB_CREATED", {
            audit: true,
            action: "JOB_CREATED_EVENT",
            resourceId: payload.jobNumber,
            timestamp: new Date().toISOString(),
        });
        broadcast("job:created", { jobNumber: payload.jobNumber });
    });

    eventBus.on(EVENTS.JOB_UPDATED, (payload) => {
        logger.info("[DOMAIN EVENT] JOB_UPDATED", {
            audit: true,
            action: "JOB_UPDATED_EVENT",
            resourceId: payload.id,
            timestamp: new Date().toISOString(),
        });
        broadcast("job:updated", { id: payload.id });
    });

    eventBus.on(EVENTS.JOB_DELETED, (payload) => {
        logger.info("[DOMAIN EVENT] JOB_DELETED", {
            audit: true,
            action: "JOB_DELETED_EVENT",
            resourceId: payload.id,
            timestamp: new Date().toISOString(),
        });
        broadcast("job:deleted", { id: payload.id });
    });

    eventBus.on(EVENTS.JOB_BULK_UPDATED, (payload) => {
        logger.info("[DOMAIN EVENT] JOB_BULK_UPDATED", {
            audit: true,
            action: "JOB_BULK_UPDATED_EVENT",
            resourceId: null,
            count: payload.count,
            timestamp: new Date().toISOString(),
        });
        broadcast("job:bulk-updated", payload);
    });

    logger.info("📡 Job SSE Listeners registered");
}
