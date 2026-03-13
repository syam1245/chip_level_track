import { eventBus, EVENTS } from "../core/events/eventBus.js";
import { aiService } from "../modules/ai/ai.service.js";
import ItemRepository from "../modules/items/items.repository.js";
import logger from "../core/utils/logger.js";

/**
 * Background listener for AI automation tasks.
 * Deliberately asynchronous to prevent blocking the main API response.
 */
export function registerAiListeners() {
    
    // React to status changes by preemptively generating the AI summary in the background
    eventBus.on(EVENTS.JOB_STATUS_CHANGED, async (payload) => {
        try {
            logger.debug(`[EventListener] Triggering background AI update for job ${payload.id}`);
            
            // Wait briefly to ensure the database write has fully committed
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const jobData = await ItemRepository.findById(payload.id);
            if (!jobData) return;
            
            // Generate the summary in the background. If the summary hasn't changed (fingerprint matches),
            // aiService.generateJobSummary will smartly skip the LLM call and return instantly.
            await aiService.generateJobSummary(jobData, false);
            logger.debug(`[EventListener] Background AI update complete for job ${payload.id}`);
            
        } catch (error) {
            // Log only, don't crash. This is a background optimization.
            logger.warn(`[EventListener] Failed background AI update for job ${payload.id}: ${error.message}`);
        }
    });

    logger.info("🤖 AI Listeners registered");
}
