import EventEmitter from "node:events";

/**
 * Global application Event Bus.
 * Used for decoupling domain logic from side-effects like notifications,
 * cache invalidation, and background AI tasks.
 */
class AppEventBus extends EventEmitter {
    constructor() {
        super();
        // Increase max listeners since we might have many subscribers
        this.setMaxListeners(20);
    }
}

export const eventBus = new AppEventBus();

/**
 * Standardized event name constants.
 * Use these instead of raw strings to avoid typos and make refactoring easier.
 */
export const EVENTS = Object.freeze({
    // Lifecycle events
    JOB_CREATED:         "job.created",
    JOB_UPDATED:         "job.updated",
    JOB_DELETED:         "job.deleted",
    
    // Status and state changes
    JOB_STATUS_CHANGED:  "job.status.changed",
    JOB_REVENUE_REALIZED: "job.revenue.realized",
    
    // Bulk operations
    JOB_BULK_UPDATED:    "job.bulk_updated",
});
