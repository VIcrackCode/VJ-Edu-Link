import "dotenv/config";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { connectDatabase } from "./config/db.js";
import { Student } from "./models/student.js";

const collegeId = String(process.env.ADMIN_COLLEGE_ID || "").trim().toUpperCase();
const name = String(process.env.ADMIN_NAME || "").trim();
const phone = String(process.env.ADMIN_PHONE || "").replace(/\D/g, "");
const password = String(process.env.ADMIN_PASSWORD || "");

async function createAdmin() {
    if (!/^[0-9]{2}[0-9]{3}[A-Z][0-9]{4}$/.test(collegeId)) {
        throw new Error("Set ADMIN_COLLEGE_ID to a valid 10-character college ID in server/.env.");
    }
    if (!name || !/^\d{10}$/.test(phone) || password.length < 8) {
        throw new Error("Set ADMIN_NAME, a 10-digit ADMIN_PHONE, and an ADMIN_PASSWORD of at least 8 characters in server/.env.");
    }

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vjedulink";
    await connectDatabase(mongoUri);

    if (await Student.exists({ role: "Admin" })) {
        throw new Error("An Admin account already exists. Use the Admin page to add more accounts.");
    }

    const admin = await Student.create({
        collegeId,
        name,
        phone,
        year: String(process.env.ADMIN_YEAR || "N/A").trim().toUpperCase(),
        branch: String(process.env.ADMIN_BRANCH || "N/A").trim().toUpperCase(),
        section: String(process.env.ADMIN_SECTION || "N/A").trim().toUpperCase(),
        role: "Admin",
        password: await hash(password, 12),
    });

    console.log(`Admin account created for ${admin.collegeId}. Share the configured credentials with the Admin directly.`);
}

createAdmin()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect().catch(() => {});
    });
