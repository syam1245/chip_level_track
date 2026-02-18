export const ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user",
});

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: ["items:create", "items:read", "items:update", "items:delete", "items:backup", "admin:access"],
  [ROLES.USER]: ["items:create", "items:read", "items:update"],
});
