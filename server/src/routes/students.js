import { Router } from "express";
import { hash } from "bcryptjs";
import multer from "multer";
import { Student } from "../models/student.js";
import { Profile } from "../models/profile.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { duplicateKeyMessage } from "../utils/errors.js";
import { uploadImage } from "../utils/googleDrive.js";

export const studentRouter = Router();

const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype.startsWith("image/")) callback(null, true);
        else callback(new Error("Choose an image file for the account profile."));
    },
});

function uploadOptionalProfileImage(req, res, next) {
    imageUpload.single("file")(req, res, (error) => {
        if (!error) return next();
        const isTooLarge = error.code === "LIMIT_FILE_SIZE";
        return res.status(isTooLarge ? 413 : 400).json({
            message: isTooLarge ? "Profile images must be 10 MB or smaller." : error.message,
        });
    });
}

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
        profileImage: user.profileImage || null,
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

studentRouter.post("/students", requireAuth, requireRole("Class Representative"), uploadOptionalProfileImage, async (req, res, next) => {
    try {
        const collegeId = String(req.body.collegeId || "").trim().toUpperCase();
        const name = String(req.body.name || "").trim();
        const phone = String(req.body.phone || "").replace(/\D/g, "");
        const password = String(req.body.password || "");

        if (!collegeId || !name || !phone || password.length < 8) {
            return res.status(400).json({ message: "College ID, name, phone, and a password of at least 8 characters are required." });
        }

        const classRepresentative = await Student.findById(req.user.sub).select("year branch section role");
        if (!classRepresentative || classRepresentative.role !== "Class Representative") {
            return res.status(401).json({ message: "Class representative account not found." });
        }
        const { year, branch, section } = classRepresentative;

        let profileImage = null;
        if (req.file) {
            const folderId = process.env.GOOGLE_DRIVE_PROFILES_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
            if (!folderId) {
                return res.status(500).json({ message: "Google Drive profile folder is not configured." });
            }
            const uploaded = await uploadImage(req.file, folderId);
            profileImage = {
                fileId: uploaded.fileId,
                url: uploaded.url,
                fileName: uploaded.fileName,
                mimeType: uploaded.mimeType,
                size: uploaded.size,
            };
        }

        const item = await Student.create({
            collegeId,
            name,
            phone,
            year,
            branch,
            section,
            role: "Student",
            password: await hash(password, 12),
            profileImage,
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
