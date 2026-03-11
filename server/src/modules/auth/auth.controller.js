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
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Only admins can view all users." });
        }
        const users = await AuthService.getUsers();
        res.json(users);
    });

    createUser = asyncHandler(async (req, res) => {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Only admins can create users." });
        }

        const { username, password, displayName } = req.body;
        if (!username || !password || !displayName) {
            return res.status(400).json({ error: "Username, password, and display name are required." });
        }
        if (username.length > 50) {
            return res.status(400).json({ error: "Username must be 50 characters or less." });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long." });
        }

        const newUser = await AuthService.createUser(username, password, displayName, "user");
        res.status(201).json({
            message: "User created successfully",
            user: { username: newUser.username, displayName: newUser.displayName, role: newUser.role }
        });
    });

    updatePassword = asyncHandler(async (req, res) => {
        const { newPassword, overrideUsername, overridePassword } = req.body;
        const { username } = req.params;
        if (!username || username.length > 50) {
            return res.status(400).json({ error: "Invalid username." });
        }

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        // Check if current user is admin
        if (req.user.role !== "admin") {
            if (!overrideUsername || !overridePassword) {
                return res.status(403).json({ error: "Admin credentials required to reset password." });
            }

            // Verify override credentials without creating a new session
            try {
                const isValid = await AuthService.verifyCredentials(overrideUsername, overridePassword, "admin");
                if (!isValid) {
                    return res.status(403).json({ error: "Invalid admin override credentials." });
                }
            } catch (error) {
                return res.status(403).json({ error: "Invalid admin override credentials." });
            }
        }

        await AuthService.updatePassword(username, newPassword);
        res.json({ message: `Password updated for ${username}` });
    });

    getTechnicianNames = asyncHandler(async (req, res) => {
        const technicians = await AuthService.getTechnicianNames();
        res.json(technicians);
    });

    toggleActive = asyncHandler(async (req, res) => {
        const { isActive } = req.body;
        const { username } = req.params;
        if (!username || username.length > 50) {
            return res.status(400).json({ error: "Invalid username." });
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Only admins can deactivate users." });
        }
        if (typeof isActive !== "boolean") {
            return res.status(400).json({ error: "isActive must be a boolean." });
        }
        if (username === req.user.username) {
            return res.status(400).json({ error: "You cannot deactivate your own account." });
        }

        const user = await AuthService.toggleActive(username, isActive);
        res.json({ message: `User ${username} is now ${isActive ? 'active' : 'inactive'}.` });
    });

    deleteUser = asyncHandler(async (req, res) => {
        const { username } = req.params;
        if (!username || username.length > 50) {
            return res.status(400).json({ error: "Invalid username." });
        }
        const { adminPassword } = req.body;

        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Only admins can completely delete users." });
        }
        if (!adminPassword) {
            return res.status(400).json({ error: "Admin password is required to confirm deletion." });
        }
        if (username === req.user.username) {
            return res.status(400).json({ error: "You cannot delete your own account." });
        }

        // Verify the admin's password
        const isAdminValid = await AuthService.verifyCredentials(req.user.username, adminPassword, "admin");
        if (!isAdminValid) {
            return res.status(403).json({ error: "Invalid admin password." });
        }

        await AuthService.deleteUser(username);
        res.json({ message: `User ${username} has been permanently deleted.` });
    });

    updateUser = asyncHandler(async (req, res) => {
        const { username } = req.params;
        if (!username || username.length > 50) {
            return res.status(400).json({ error: "Invalid username." });
        }
        const { newUsername, displayName } = req.body;

        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Only admins can edit users." });
        }

        if (!newUsername && !displayName) {
            return res.status(400).json({ error: "Username or display name is required." });
        }

        const updates = {};
        if (newUsername) updates.username = newUsername.trim();
        if (displayName) updates.displayName = displayName.trim();

        await AuthService.updateUser(username, updates);
        res.json({ message: `User ${username} updated successfully.` });
    });
}

export default new AuthController();
