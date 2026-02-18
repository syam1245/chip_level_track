import { hashPassword } from "../auth/password.js";
import { ROLES } from "../constants/roles.js";

const adminPassword = process.env.ADMIN_PASSWORD;
const normalUserPassword = process.env.NORMAL_USER_PASSWORD;

if (!adminPassword || !normalUserPassword) {
  throw new Error("ADMIN_PASSWORD and NORMAL_USER_PASSWORD must be configured.");
}

export const PREDEFINED_USERS = [
  {
    username: "admin",
    role: ROLES.ADMIN,
    passwordHash: hashPassword(adminPassword),
    displayName: "Admin User",
  },
  {
    username: "user",
    role: ROLES.USER,
    passwordHash: hashPassword(normalUserPassword),
    displayName: "Normal User",
  },
];
