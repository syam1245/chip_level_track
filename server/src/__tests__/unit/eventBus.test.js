import { jest } from "@jest/globals";
import { eventBus, EVENTS } from "../../core/events/eventBus.js";

describe("Domain Event Bus", () => {
    
    beforeEach(() => {
        // Clear all listeners to isolate tests
        eventBus.removeAllListeners();
    });

    test("should export predefined events enum", () => {
        expect(EVENTS).toHaveProperty("JOB_CREATED");
        expect(EVENTS).toHaveProperty("JOB_STATUS_CHANGED");
        expect(EVENTS.JOB_CREATED).toBe("job.created");
    });

    // Basic EventEmitter sanity tests
    test("should emit and listen to events", () => {
        const mockCallback = jest.fn();
        eventBus.on(EVENTS.JOB_CREATED, mockCallback);

        eventBus.emit(EVENTS.JOB_CREATED, { id: 123 });

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith({ id: 123 });
    });

    test("should support multiple listeners for the same event", () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        
        eventBus.on(EVENTS.JOB_UPDATED, callback1);
        eventBus.on(EVENTS.JOB_UPDATED, callback2);

        eventBus.emit(EVENTS.JOB_UPDATED, { id: "alpha" });

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
    });

    test("should not fire if event name is different", () => {
        const mockCallback = jest.fn();
        eventBus.on(EVENTS.JOB_CREATED, mockCallback);

        eventBus.emit(EVENTS.JOB_DELETED, { id: 123 });

        expect(mockCallback).not.toHaveBeenCalled();
    });
});
