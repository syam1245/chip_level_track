export const ROLES = Object.freeze({
    ADMIN: "admin",
    USER:  "user",
});

export const ROLE_PERMISSIONS = Object.freeze({
    // Object.freeze() is shallow — without freezing each array, any module could
    // push a permission onto ROLE_PERMISSIONS.admin and corrupt it process-wide.
    [ROLES.ADMIN]: Object.freeze([
        "items:create",
        "items:read",
        "items:update",
        "items:delete",
        "items:backup",
        "admin:access",
    ]),
    [ROLES.USER]: Object.freeze([
        "items:create",
        "items:read",
        "items:update",
        "items:delete",
    ]),
});

// ── Dev-time completeness check ───────────────────────────────────────────────
// Every value in ROLES must have a corresponding entry in ROLE_PERMISSIONS.
// Without this, adding a new role (e.g. ROLES.MANAGER) but forgetting to add
// its permissions causes requirePermission to silently return 403 for all
// requests from that role — no error, no log, just a blocked user.
if (process.env.NODE_ENV !== "production") {
    for (const role of Object.values(ROLES)) {
        if (!ROLE_PERMISSIONS[role]) {
            throw new Error(
                `[roles.js] Role "${role}" is defined in ROLES but has no entry in ROLE_PERMISSIONS.`
            );
        }
    }
}