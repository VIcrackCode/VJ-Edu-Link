import { Router } from "express";
import { hash } from "bcryptjs";
import { Student } from "../models/student.js";
import { Profile } from "../models/profile.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { duplicateKeyMessage } from "../utils/errors.js";

export const studentRouter = Router();

function publicStudent(user) {
    return {
        id: user._id.toString(),
        collegeId: user.collegeId,
        name: user.name,
        role: user.role,
        phone: user.phone,
        year: user.year,
        branch: user.branch,
        section: user.section,
    };
}

studentRouter.get("/students", requireAuth, requireRole("Class Representative"), async (_req, res, next) => {
    try {
        const items = await Student.find().sort({ collegeId: 1 }).select("-password");
        res.json({ items: items.map(publicStudent) });
    } catch (error) {
        next(error);
    }
});

studentRouter.post("/students", requireAuth, requireRole("Class Representative"), async (req, res, next) => {
    try {
        const collegeId = String(req.body.collegeId || "").trim().toUpperCase();
        const name = String(req.body.name || "").trim();
        const phone = String(req.body.phone || "").replace(/\D/g, "");
        const year = String(req.body.year || "").trim();
        const branch = String(req.body.branch || "").trim().toUpperCase();
        const section = String(req.body.section || "").trim().toUpperCase();
        const role = req.body.role === "Class Representative" ? "Class Representative" : "Student";
        const password = String(req.body.password || "");

        if (!collegeId || !name || !phone || !year || !branch || !section || password.length < 8) {
            return res.status(400).json({ message: "Fill every field. Password must be at least 8 characters." });
        }

        const item = await Student.create({
            collegeId,
            name,
            phone,
            year,
            branch,
            section,
            role,
            password: await hash(password, 12),
        });
        res.status(201).json({ item: publicStudent(item) });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: duplicateKeyMessage(error) });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
});

studentRouter.delete("/students/:id", requireAuth, requireRole("Class Representative"), async (req, res, next) => {
    try {
        if (req.params.id === req.user.sub) {
            return res.status(400).json({ message: "You cannot delete your own account." });
        }
        const item = await Student.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: "Student not found." });
        await Profile.deleteMany({ ownerId: item._id });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});
