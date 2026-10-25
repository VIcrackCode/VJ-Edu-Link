import { Router } from "express";
import { hash } from "bcryptjs";
import { Student } from "../models/student.js";
import { Profile } from "../models/profile.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { duplicateKeyMessage } from "../utils/errors.js";

export const adminRouter = Router();

const ROLES = new Set(["Student", "Class Representative", "Admin"]);
const COLLEGE_ID_PATTERN = /^[0-9]{2}[0-9]{3}[A-Z][0-9]{4}$/;

function serializeAccount(user) {
    return {
        id: user._id.toString(),
        collegeId: user.collegeId,
        name: user.name,
        role: user.role,
        phone: user.phone,
        year: user.year,
        branch: user.branch,
        section: user.section,
        profileImage: user.profileImage || null,
    };
}

function parseAccount(body = {}) {
    const collegeId = String(body.collegeId || "").trim().toUpperCase();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").replace(/\D/g, "");
    const year = String(body.year || "").trim().toUpperCase();
    const branch = String(body.branch || "").trim().toUpperCase();
    const section = String(body.section || "").trim().toUpperCase();
    const role = String(body.role || "").trim();

    if (!COLLEGE_ID_PATTERN.test(collegeId)) {
        return { error: "College ID must look like 25071A0001." };
    }
    if (!name || !/^\d{10}$/.test(phone) || !year || !branch || !section) {
        return { error: "Name, 10-digit phone, year, branch, and section are required." };
    }
    if (!ROLES.has(role)) {
        return { error: "Choose Student, Class Representative, or Admin as the role." };
    }

    return { account: { collegeId, name, phone, year, branch, section, role } };
}

function handleDatabaseError(error, res, next) {
    if (error.code === 11000) {
        return res.status(409).json({ message: duplicateKeyMessage(error) });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ message: error.message });
    }
    return next(error);
}

adminRouter.use(requireAuth, requireRole("Admin"));

adminRouter.get("/admin/accounts", async (_req, res, next) => {
    try {
        const accounts = await Student.find().sort({ branch: 1, year: 1, section: 1, collegeId: 1 }).select("-password").lean();
        res.json({ items: accounts.map(serializeAccount) });
    } catch (error) {
        next(error);
    }
});

adminRouter.post("/admin/accounts", async (req, res, next) => {
    try {
        const { account, error } = parseAccount(req.body);
        const password = String(req.body?.password || "");
        if (error) return res.status(400).json({ message: error });
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters." });
        }

        const user = await Student.create({ ...account, password: await hash(password, 12) });
        res.status(201).json({ item: serializeAccount(user) });
    } catch (error) {
        handleDatabaseError(error, res, next);
    }
});

adminRouter.put("/admin/accounts/:id", async (req, res, next) => {
    try {
        const existing = await Student.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: "Account not found." });

        const { account, error } = parseAccount(req.body);
        if (error) return res.status(400).json({ message: error });

        if (existing.role === "Admin" && account.role !== "Admin") {
            const adminCount = await Student.countDocuments({ role: "Admin" });
            if (adminCount <= 1) {
                return res.status(409).json({ message: "The last Admin account cannot be changed to another role." });
            }
        }

        const updates = { ...account };
        const password = String(req.body?.password || "");
        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ message: "A new password must be at least 8 characters." });
            }
            updates.password = await hash(password, 12);
        }

        const user = await Student.findByIdAndUpdate(req.params.id, { $set: updates }, {
            new: true,
            runValidators: true,
        });
        if (!user) return res.status(404).json({ message: "Account not found." });
        await Profile.updateMany({ ownerId: user._id }, { $set: { ownerCollegeId: user.collegeId } });
        res.json({ item: serializeAccount(user) });
    } catch (error) {
        handleDatabaseError(error, res, next);
    }
});

adminRouter.delete("/admin/accounts/:id", async (req, res, next) => {
    try {
        const existing = await Student.findById(req.params.id).select("role");
        if (!existing) return res.status(404).json({ message: "Account not found." });

        if (existing.role === "Admin") {
            const adminCount = await Student.countDocuments({ role: "Admin" });
            if (adminCount <= 1) {
                return res.status(409).json({ message: "The last Admin account cannot be deleted." });
            }
        }

        const user = await Student.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "Account not found." });
        await Profile.deleteMany({ ownerId: user._id });
        res.status(204).end();
    } catch (error) {
        handleDatabaseError(error, res, next);
    }
});
