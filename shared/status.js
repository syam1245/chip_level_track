// ── Single source of truth for job statuses ───────────────────────────────────
// Shared between server and client to avoid sync hazards.
// Must remain pure JS constants — no Node.js-specific imports.

export const STATUS_COLORS = Object.freeze({
    Received:           "default",
    "Sent to Service":  "info",
    "In Progress":      "warning",
    "Waiting for Parts":"error",
    Ready:              "success",
    Delivered:          "primary",
    Return:             "error",
    Pending:            "secondary",
});

export const STATUS_ACCENT = Object.freeze({
    Received:           "#94a3b8",
    "Sent to Service":  "#3b82f6",
    "In Progress":      "#f59e0b",
    "Waiting for Parts":"#ef4444",
    Ready:              "#10b981",
    Delivered:          "#6366f1",
    Return:             "#a855f7",
    Pending:            "#fb7185",
});

// Derived — never maintain this list manually.
export const ALLOWED_STATUSES = Object.freeze(Object.keys(STATUS_COLORS));
