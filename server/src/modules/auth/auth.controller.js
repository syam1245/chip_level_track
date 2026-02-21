import AuthService from "./auth.service.js";
import asyncHandler from "../../core/utils/asyncHandler.js";
import { setAuthCookies, clearAuthCookies } from "./auth.middleware.js";

class AuthController {
    login = asyncHandler(async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const { user, token, csrfToken } = await AuthService.login(username, password);
        setAuthCookies(res, token, csrfToken);

        res.json(user);
    });

    logout = asyncHandler(async (req, res) => {
        clearAuthCookies(res);
        res.status(204).send();
    });

    getSession = asyncHandler(async (req, res) => {
        res.json({
            username: req.user.username,
            role: req.user.role,
            displayName: req.user.displayName,
            csrfToken: req.user.csrfToken,
        });
    });

    getUsers = asyncHandler(async (req, res) => {
        const users = await AuthService.getUsers();
        res.json(users);
    });

    updatePassword = asyncHandler(async (req, res) => {
        const { newPassword, overrideUsername, overridePassword } = req.body;
        const { username } = req.params;

        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ error: "Password must be at least 4 characters" });
        }

        // Check if current user is admin
        if (req.user.role !== "admin") {
            if (!overrideUsername || !overridePassword) {
                return res.status(403).json({ error: "Admin credentials required to reset password." });
            }

            // Verify override credentials
            try {
                // We use AuthService.login just to verify the credentials without creating a new session
                const { user: overrideUser } = await AuthService.login(overrideUsername, overridePassword);
                if (overrideUser.role !== "admin") {
                    return res.status(403).json({ error: "Override user must be an administrator." });
                }
            } catch (error) {
                return res.status(403).json({ error: "Invalid admin override credentials." });
            }
        }

        await AuthService.updatePassword(username, newPassword);
        res.json({ message: `Password updated for ${username}` });
    });
}

export default new AuthController();
