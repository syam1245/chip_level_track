import User from "./models/user.model.js";

class AuthRepository {
    async findByUsername(username) {
        // Case-insensitive match so login works regardless of capitalisation
        const pattern = new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        return await User.findOne({ username: { $regex: pattern } });
    }

    async findAllUsers() {
        return await User.find({}, "username displayName role").sort({ username: 1 }).lean();
    }

    async updatePassword(username, hashedPassword) {
        const pattern = new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        return await User.findOneAndUpdate(
            { username: { $regex: pattern } },
            { password: hashedPassword },
            { new: true }
        );
    }
}

export default new AuthRepository();
