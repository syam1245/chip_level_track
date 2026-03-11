import User from "../../modules/auth/models/user.model.js";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";

export const seedUsers = async () => {
    try {
        const count = await User.countDocuments();
        if (count > 0) return;

        logger.info("🌱 Seeding initial technicians...");

        const technicians = [
            {
                username: "Shyam",
                role: "admin",
                password: process.env.TECH_PASSWORD_SHYAM,
                displayName: "Shyam (Admin)"
            },
            {
                username: "Rakesh",
                role: "user",
                password: process.env.TECH_PASSWORD_RAKESH,
                displayName: "Rakesh"
            },
            {
                username: "Akhil",
                role: "user",
                password: process.env.TECH_PASSWORD_AKHIL,
                displayName: "Akhil"
            },
            {
                username: "Nabeel",
                role: "user",
                password: process.env.TECH_PASSWORD_NABEEL,
                displayName: "Nabeel"
            },
        ];

        for (const tech of technicians) {
            if (!tech.password || tech.password.length < 8) {
                logger.warn(`⚠️ Skipping seed for ${tech.username}: TECH_PASSWORD_${tech.username.toUpperCase()} env var missing or too short (min 8 chars)`);
                continue;
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(tech.password, salt);
            await new User({
                username: tech.username,
                password: hashedPassword,
                displayName: tech.displayName,
                role: tech.role,
            }).save();
        }

        logger.info("✅ Technicians seeded successfully");
    } catch (err) {
        logger.error("❌ Seeding error:", err);
    }
};
