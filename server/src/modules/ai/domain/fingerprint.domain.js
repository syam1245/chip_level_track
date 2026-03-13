/**
 * AI fingerprint domain logic.
 *
 * Pure business rules for job fingerprinting and data sanitization.
 * Extracted from ai.service.js so they can be tested without LLM or DB.
 */

/**
 * Strip control characters and known prompt-injection patterns from text.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeForPrompt(text) {
    if (!text || typeof text !== "string") return "";
    return text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars
        .replace(/ignore\s+(previous|above|all)\s+instructions?/gi, "[REDACTED]")
        .replace(/system\s*:\s*/gi, "[REDACTED]")
        .trim();
}

/**
 * Generate a deterministic fingerprint for job data to detect changes.
 * Used to avoid re-generating AI summaries when nothing meaningful changed.
 *
 * @param {object} data — job data with brand, status, issue, repairNotes, technicianName
 * @returns {string}
 */
export function generateFingerprint(data = {}) {
    const fields = [
        data.brand,
        data.status,
        data.issue,
        data.repairNotes,
        data.technicianName,
    ];

    return fields.map((v) => (v ? String(v).trim() : "")).join("|");
}

/**
 * Sanitize and structure job data for LLM consumption.
 *
 * @param {object} jobData — raw job document
 * @returns {object} — cleaned data safe for prompt injection
 */
export function sanitizeJobData(jobData = {}) {
    const history = Array.isArray(jobData.statusHistory)
        ? jobData.statusHistory.slice(-5) // limit to last 5 entries
        : [];

    return {
        jobNumber: jobData.jobNumber || "N/A",
        customer: sanitizeForPrompt(jobData.customerName) || "Customer",
        deviceBrand: sanitizeForPrompt(jobData.brand) || "Not Specified",
        initialReportedIssue: sanitizeForPrompt(jobData.issue) || "Not Specified",
        currentStatus: jobData.status || "Received",
        latestTechnicianNotes: sanitizeForPrompt(jobData.repairNotes) || "",
        assignedTechnician: sanitizeForPrompt(jobData.technicianName) || "Unknown",
        jobCreatedOn: jobData.formattedDate || "",
        technicalHistory: history.map((entry) => ({
            statusWas: entry?.status || "",
            techComment: sanitizeForPrompt(entry?.note) || "No note",
            timeOfEntry: entry?.changedAt
                ? new Date(entry.changedAt).toLocaleDateString("en-IN")
                : "",
        })),
    };
}
