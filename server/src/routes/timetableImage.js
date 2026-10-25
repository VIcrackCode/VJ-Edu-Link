import { Router } from "express";
import multer from "multer";
import { Content } from "../models/content.js";
import { TimetableImage } from "../models/timetableImage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { downloadImage, uploadImage } from "../utils/googleDrive.js";

export const timetableImageRouter = Router();

const IMAGE_ID = "class-timetable";
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype.startsWith("image/")) callback(null, true);
        else callback(new Error("Only image files are allowed."));
    },
});

function getFileId(image) {
    if (image && typeof image === "object") {
        const fileId = image.fileId || image.id;
        return typeof fileId === "string" ? fileId : "";
    }

    if (typeof image !== "string") return "";
    try {
        const url = new URL(image);
        if (!url.hostname.endsWith("drive.google.com")) return "";
        return url.searchParams.get("id") || url.pathname.match(/\/d\/([^/]+)/)?.[1] || "";
    } catch {
        return "";
    }
}

async function getCurrentImage() {
    const saved = await TimetableImage.findById(IMAGE_ID).lean();
    if (saved?.image) return saved.image;

    const legacyRecords = await Content.find({
        type: "timetable",
        "data.timetableImage": { $exists: true },
    }).sort({ createdAt: -1 }).select("data.timetableImage").lean();

    return legacyRecords
        .map((record) => record.data?.timetableImage)
        .find((image) => Boolean(image)) || null;
}

async function sendImage(image, res, next) {
    const fileId = getFileId(image);
    if (!fileId) {
        return res.status(404).json({ message: "Timetable image not found." });
    }

    try {
        const file = await downloadImage(fileId);
        if (!file.mimeType.toLowerCase().startsWith("image/")) {
            file.stream.destroy();
            return res.status(415).json({ message: "The stored file is not an image." });
        }

        res.setHeader("Content-Type", file.mimeType);
        res.setHeader("Cache-Control", "private, max-age=3600");
        res.setHeader("X-Content-Type-Options", "nosniff");
        if (file.contentLength) res.setHeader("Content-Length", file.contentLength);

        file.stream.on("error", (error) => {
            if (res.headersSent) res.destroy(error);
            else next(error);
        });
        file.stream.pipe(res);
    } catch (error) {
        next(error);
    }
}

timetableImageRouter.get("/timetable-image", requireAuth, async (_req, res, next) => {
    try {
        const image = await getCurrentImage();
        res.json({ image });
    } catch (error) {
        next(error);
    }
});

timetableImageRouter.get("/timetable-image/file", requireAuth, async (_req, res, next) => {
    try {
        await sendImage(await getCurrentImage(), res, next);
    } catch (error) {
        next(error);
    }
});

timetableImageRouter.put(
    "/timetable-image",
    requireAuth,
    requireRole("Class Representative"),
    upload.single("file"),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "Choose a timetable image to upload." });
            }

            const folderId = process.env.GOOGLE_DRIVE_TIMETABLE_FOLDER_ID;
            if (!folderId) {
                return res.status(500).json({ message: "Google Drive timetable folder is not configured." });
            }

            const uploaded = await uploadImage(req.file, folderId);
            const image = {
                fileId: uploaded.fileId,
                url: uploaded.url,
                fileName: uploaded.fileName,
                mimeType: uploaded.mimeType,
            };

            const saved = await TimetableImage.findByIdAndUpdate(
                IMAGE_ID,
                { $set: { image, updatedBy: req.user.sub } },
                { new: true, upsert: true, runValidators: true }
            );

            res.json({ image: saved.image });
        } catch (error) {
            next(error);
        }
    }
);
