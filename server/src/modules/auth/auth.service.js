import bcrypt from "bcryptjs";
import crypto from "crypto";
import AuthRepository from "./auth.repository.js";
import { createAuthToken } from "./auth.token.js";
import AppError from "../../core/errors/AppError.js";

class AuthService {
    async hashPassword(plainPassword) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(plainPassword, salt);
    }

    async verifyPassword(plainPassword, storedHash) {
        return bcrypt.compare(plainPassword, storedHash);
    }

    async login(username, password) {
        const user = await AuthRepository.findByUsername(username);
        if (!user || !(await this.verifyPassword(password, user.password))) {
            throw new AppError("Invalid credentials", 401);
        }

        const csrfToken = crypto.randomBytes(24).toString("hex");
        const token = createAuthToken({
            username: user.username,
            role: user.role,
            displayName: user.displayName,
            csrfToken,
        });

        return {
            user: {
                username: user.username,
                role: user.role,
                displayName: user.displayName,
                csrfToken,
            },
            token,
            csrfToken,
        };
    }

    async getUsers() {
        return await AuthRepository.findAllUsers();
    }

    /**
     * Verify credentials without creating a session.
     * @param {string} username
     * @param {string} password
     * @param {string|null} requiredRole - If provided, user must also have this role
     * @returns {boolean} true if credentials are valid (and role matches if specified)
     */
    async verifyCredentials(username, password, requiredRole = null) {
        const user = await AuthRepository.findByUsername(username);
        if (!user) return false;

        const passwordOk = await this.verifyPassword(password, user.password);
        if (!passwordOk) return false;

        if (requiredRole && user.role !== requiredRole) return false;

        return true;
    }

    async updatePassword(username, newPassword) {
        const user = await AuthRepository.findByUsername(username);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const hashedPassword = await this.hashPassword(newPassword);
        return await AuthRepository.updatePassword(username, hashedPassword);
    }
}

export default new AuthService();
