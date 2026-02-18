import User from "../models/User.js";
import { hashPassword } from "../auth/password.js";

export const seedUsers = async () => {
    try {
        const count = await User.countDocuments();
        if (count > 0) return; // Already seeded

        console.log("🌱 Seeding initial technicians...");

        const technicians = [
            {
                username: "Shyam",
                role: "admin",
                password: process.env.TECH_PASSWORD_SHYAM || "shyamadmin",
                displayName: "Shyam (Admin)"
            },
            {
                username: "Rakesh",
                role: "user",
                password: process.env.TECH_PASSWORD_RAKESH || "rakesh123",
                displayName: "Rakesh"
            },
            {
                username: "Akhil",
                role: "user",
                password: process.env.TECH_PASSWORD_AKHIL || "akhil123",
                displayName: "Akhil"
            },
            {
                username: "Nabeel",
                role: "user",
                password: process.env.TECH_PASSWORD_NABEEL || "nabeel123",
                displayName: "Nabeel"
            },
        ];

        for (const tech of technicians) {
            const hashedPassword = await hashPassword(tech.password);
            await new User({
                username: tech.username,
                password: hashedPassword,
                displayName: tech.displayName,
                role: tech.role,
            }).save();
        }

        console.log("✅ Technicians seeded successfully");
    } catch (err) {
        console.error("❌ Seeding error:", err);
    }
};
