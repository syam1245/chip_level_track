import { eventBus, EVENTS } from "../core/events/eventBus.js";
import { broadcast } from "../modules/items/items.events.js";
import logger from "../core/utils/logger.js";

/**
 * Listener for Job-related real-time Server-Sent Events (SSE).
 */
export function registerJobListeners() {
    eventBus.on(EVENTS.JOB_CREATED, (payload) => {
        logger.debug(`[EventListener] JOB_CREATED: ${payload.jobNumber}`);
        broadcast("job:created", { jobNumber: payload.jobNumber });
    });

    eventBus.on(EVENTS.JOB_UPDATED, (payload) => {
        logger.debug(`[EventListener] JOB_UPDATED: ${payload.id}`);
        broadcast("job:updated", { id: payload.id });
    });

    eventBus.on(EVENTS.JOB_DELETED, (payload) => {
        logger.debug(`[EventListener] JOB_DELETED: ${payload.id}`);
        broadcast("job:deleted", { id: payload.id });
    });

    eventBus.on(EVENTS.JOB_BULK_UPDATED, (payload) => {
        logger.debug(`[EventListener] JOB_BULK_UPDATED: ${payload.count} items`);
        // { count: number, isDelete?: boolean, status?: string }
        broadcast("job:bulk-updated", payload);
    });

    logger.info("📡 Job SSE Listeners registered");
}
