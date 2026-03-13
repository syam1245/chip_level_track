import { registerJobListeners } from "./job.listener.js";
import { registerAnalyticsListeners } from "./analytics.listener.js";
import { registerAiListeners } from "./ai.listener.js";

/**
 * Initializes all domain event listeners on application startup.
 * Attaches specific side-effect handlers (like SSE, caching, AI) to 
 * the central EventBus to keep services decoupled.
 */
export function initializeEventListeners() {
    registerJobListeners();
    registerAnalyticsListeners();
    registerAiListeners();
}
