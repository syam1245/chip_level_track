/**
 * Server-Sent Events (SSE) broadcaster.
 * Holds a registry of connected response streams and emits events to all of them
 * whenever a job CRUD operation occurs.
 */

import logger from "../../core/utils/logger.js";

const clients = new Set();

/**
 * Get the current number of connected SSE clients.
 * @returns {number}
 */
export function getClientCount() {
    return clients.size;
}

/**
 * Register a new SSE client connection.
 * @param {import('express').Response} res
 */
export function registerClient(res) {
    clients.add(res);
    res.on("close", () => clients.delete(res));
}

/**
 * Broadcast a named event with optional JSON payload to all connected clients.
 * @param {string} event - e.g. "job:created", "job:updated", "job:deleted"
 * @param {object} [data]
 */
export function broadcast(event, data = {}) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
        try {
            res.write(payload);
        } catch (err) {
            // Write failed — client disconnected without firing the "close" event
            // (can happen with some proxies). Remove from registry and log at debug
            // level — this is expected behaviour, not an error worth alerting on.
            logger.debug(`SSE client removed after write failure: ${err.message}`);
            clients.delete(res);
        }
    }
}