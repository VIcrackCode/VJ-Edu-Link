import { Router } from "express";
import { compare, hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Student } from "../models/student.js";
import { PasswordReset } from "../models/passwordReset.js";
import { jwtSecret, requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

function publicUser(user) {
    return {
        id: user.collegeId,
        collegeId: user.collegeId,
        name: user.name,
        role: user.role,
        phone: user.phone,
        year: user.year,
        branch: user.branch,
        section: user.section,
    };
}

function hashOtp(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

authRouter.post("/auth/login", async (req, res, next) => {
    try {
        const collegeId = String(req.body.id || req.body.collegeId || "").trim().toUpperCase();
        const password = req.body.password || "";
        const user = await Student.findOne({ collegeId });
        if (!user || !(await compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid college ID or password." });
        }
        const token = jwt.sign({ sub: user._id.toString(), role: user.role, collegeId: user.collegeId }, jwtSecret(), { expiresIn: "8h" });
        res.json({ token, user: publicUser(user) });
    } catch (error) {
        next(error);
    }
});

authRouter.get("/auth/me", requireAuth, async (req, res, next) => {
    try {
        const user = await Student.findById(req.user.sub);
        if (!user) return res.status(401).json({ message: "Account not found." });
        res.json({ user: publicUser(user) });
    } catch (error) {
        next(error);
    }
});

authRouter.post("/auth/password-reset/request", async (req, res, next) => {
    try {
        if (process.env.NODE_ENV !== "development") {
            return res.status(503).json({
                message: "Password reset delivery is not configured. Contact your administrator.",
            });
        }

        const phone = String(req.body.phone || "").replace(/\D/g, "");
        const user = await Student.findOne({ phone });
        if (!user) {
            return res.json({ message: "If the number is registered, an OTP has been sent." });
        }
        const otp = crypto.randomInt(100000, 1000000).toString();
        await PasswordReset.deleteMany({ userId: user._id });
        await PasswordReset.create({
            userId: user._id,
            codeHash: hashOtp(otp),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });
        res.json({
            message: "If the number is registered, an OTP has been sent.",
            ...(process.env.NODE_ENV === "development" ? { developmentOtp: otp } : {}),
        });
    } catch (error) {
        next(error);
    }
});

authRouter.post("/auth/password-reset/confirm", async (req, res, next) => {
    try {
        const phone = String(req.body.phone || "").replace(/\D/g, "");
        const { otp, password } = req.body;
        if (!/^\d{6}$/.test(otp || "") || String(password || "").length < 8) {
            return res.status(400).json({ message: "Provide a valid OTP and a password of at least 8 characters." });
        }
        const user = await Student.findOne({ phone });
        const reset = user && await PasswordReset.findOne({ userId: user._id });
        if (!reset || reset.expiresAt < new Date() || reset.attempts >= 5) {
            return res.status(400).json({ message: "OTP expired. Request a new one." });
        }
        if (reset.codeHash !== hashOtp(otp)) {
            reset.attempts += 1;
            await reset.save();
            return res.status(400).json({ message: "Invalid OTP." });
        }
        user.password = await hash(password, 12);
        await user.save();
        await reset.deleteOne();
        res.json({ message: "Password reset successfully." });
    } catch (error) {
        next(error);
    }
});
