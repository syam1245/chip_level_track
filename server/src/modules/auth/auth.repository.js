import User from "./models/user.model.js";

class AuthRepository {
    async findByUsername(username) {
        // Case-insensitive match so login works regardless of capitalisation
        const pattern = new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        return await User.findOne({ username: { $regex: pattern } });
    }

    async createUser({ username, password, displayName, role }) {
        const user = new User({ username, password, displayName, role });
        return await user.save();
    }

    async findAllUsers() {
        return await User.find({}, "username displayName role isActive").sort({ isActive: -1, username: 1 }).lean();
    }

    async findAllTechnicianNames() {
        return await User.find({ isActive: { $ne: false } }, "username displayName").sort({ username: 1 }).lean();
    }

    async updatePassword(username, hashedPassword) {
        const pattern = new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        return await User.findOneAndUpdate(
            { username: { $regex: pattern } },
            { password: hashedPassword },
            { new: true }
        );
    }

    async toggleActive(username, isActive) {
        const pattern = new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        return await User.findOneAndUpdate(
            { username: { $regex: pattern } },
            { isActive },
            { new: true }
        );
    }

    async deleteUser(username) {
        const pattern = new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        return await User.deleteOne({ username: { $regex: pattern } });
    }

    async updateUser(oldUsername, updates) {
        const pattern = new RegExp(`^${oldUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        return await User.findOneAndUpdate(
            { username: { $regex: pattern } },
            { $set: updates },
            { new: true }
        );
    }
}

export default new AuthRepository();
