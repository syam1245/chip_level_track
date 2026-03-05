import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    displayName: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "user"] },
    isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
