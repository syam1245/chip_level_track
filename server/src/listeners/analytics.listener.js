import { eventBus, EVENTS } from "../core/events/eventBus.js";
import StatsService from "../modules/stats/stats.service.js";
import logger from "../core/utils/logger.js";

/**
 * Listener for analytics and statistical updates.
 */
export function registerAnalyticsListeners() {
    // When a job brings in revenue (e.g. status changed to Ready/Delivered)
    eventBus.on(EVENTS.JOB_REVENUE_REALIZED, (payload) => {
        logger.debug(`[EventListener] JOB_REVENUE_REALIZED at ${payload.date}`);
        StatsService.invalidateRevenueCache(payload.date);
    });

    // If needed in the future, we can listen to job created/deleted
    // to update general count analytics tables instead of relying solely on aggregation.

    logger.info("📊 Analytics Listeners registered");
}
