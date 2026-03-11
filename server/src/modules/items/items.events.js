/**
 * Server-Sent Events (SSE) broadcaster.
 * Holds a registry of connected response streams and emits events to all of them
 * whenever a job CRUD operation occurs.
 */

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
        } catch (_) {
            clients.delete(res);
        }
    }
}

