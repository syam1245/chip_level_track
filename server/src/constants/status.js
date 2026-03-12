// ── Single source of truth for job statuses ───────────────────────────────────
// Imported by both server (validators, model enum) and client (chip colors,
// aging UI) via client/src/constants/status.js re-export.
// Must remain pure JS constants — no Node.js-specific imports ever.

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

// ── Dev-time parity check ─────────────────────────────────────────────────────
// STATUS_COLORS and STATUS_ACCENT must always have identical keys.
// If a new status is added to one but not the other, the UI silently gets
// undefined accent colors or the aging component breaks. Catch it at startup.
if (process.env.NODE_ENV !== "production") {
    const colorKeys  = Object.keys(STATUS_COLORS).sort();
    const accentKeys = Object.keys(STATUS_ACCENT).sort();
    const missing = colorKeys.filter((k) => !STATUS_ACCENT[k]);
    const extra   = accentKeys.filter((k) => !STATUS_COLORS[k]);

    if (missing.length || extra.length) {
        throw new Error(
            `[status.js] STATUS_COLORS and STATUS_ACCENT keys are out of sync.\n` +
            (missing.length ? `  Missing from STATUS_ACCENT: ${missing.join(", ")}\n` : "") +
            (extra.length   ? `  Missing from STATUS_COLORS: ${extra.join(", ")}\n`  : "")
        );
    }
}

// Derived — never maintain this list manually.
// Object.keys() returns insertion order in V8, which is deterministic for
// string keys. Adding a new status to STATUS_COLORS automatically includes
// it here, in item.model enum, and in all validators.
export const ALLOWED_STATUSES = Object.freeze(Object.keys(STATUS_COLORS));