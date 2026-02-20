import User from "./models/user.model.js";

class AuthRepository {
    async findByUsername(username) {
        return await User.findOne({ username });
    }

    async findAllUsers() {
        return await User.find({}, "username displayName role").sort({ username: 1 });
    }

    async updatePassword(username, hashedPassword) {
        return await User.findOneAndUpdate(
            { username },
            { password: hashedPassword },
            { new: true }
        );
    }
}

export default new AuthRepository();
