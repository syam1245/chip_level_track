// ── Single source of truth for job statuses ───────────────────────────────────
// Imported by validators, model enum, and client-side via re-export.
import { STATUS_COLORS, STATUS_ACCENT, ALLOWED_STATUSES } from '../../../shared/status.js';

export { STATUS_COLORS, STATUS_ACCENT, ALLOWED_STATUSES };

// ── Dev-time parity check ─────────────────────────────────────────────────────
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