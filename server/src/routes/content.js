import { Router } from "express";
import multer from "multer";

import { Content, CONTENT_TYPES } from "../models/content.js";
import { isValidContent } from "../models/contentRules.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { downloadFile, uploadFile } from "../utils/googleDrive.js";

export const contentRouter = Router();


/* =========================================================
   MULTER UPLOAD CONFIGURATION
   ========================================================= */

const upload = multer({

    storage: multer.memoryStorage(),

    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },

    fileFilter: (req, file, cb) => {

        const officeAndDocumentTypes = new Set([
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "text/csv",
            "application/csv",
        ]);

        if (file.mimetype.startsWith("image/") || officeAndDocumentTypes.has(file.mimetype)) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Choose an image, PDF, Office document, CSV, or text file."
                )
            );

        }

    },

});

function uploadSingleFile(req, res, next) {
    upload.single("file")(req, res, (error) => {
        if (!error) return next();
        const isTooLarge = error.code === "LIMIT_FILE_SIZE";
        return res.status(isTooLarge ? 413 : 400).json({
            message: isTooLarge
                ? "Files must be 10 MB or smaller."
                : error.message || "The selected file could not be uploaded.",
        });
    });
}


/* =========================================================
   SERIALIZE CONTENT
   ========================================================= */

function serialize(doc) {

    const data =
        doc.data &&
            typeof doc.data === "object"
            ? doc.data
            : {};

    return {

        id: String(doc._id),

        type: doc.type,

        createdAt: doc.createdAt,

        ...data,

    };

}

function getStoredFileId(image) {
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

function validationMessage(contentType, data) {
    if (
        contentType === "resources" &&
        !(typeof data.documentLink === "string" && data.documentLink.trim()) &&
        !getStoredFileId(data.attachment)
    ) {
        return "Provide a Google Drive document link or upload an attachment.";
    }
    return "All required fields must be provided.";
}


/* =========================================================
   GOOGLE DRIVE FOLDER MAPPING
   ========================================================= */

const DRIVE_FOLDER_IDS = {

    announcements:
        process.env.GOOGLE_DRIVE_ANNOUNCEMENTS_FOLDER_ID,

    events:
        process.env.GOOGLE_DRIVE_EVENTS_FOLDER_ID,

    tandp:
        process.env.GOOGLE_DRIVE_TANDP_FOLDER_ID,

    courses:
        process.env.GOOGLE_DRIVE_COURSES_FOLDER_ID,

    timetable:
        process.env.GOOGLE_DRIVE_TIMETABLE_FOLDER_ID,

    resources:
        process.env.GOOGLE_DRIVE_RESOURCES_FOLDER_ID,

    profiles:
        process.env.GOOGLE_DRIVE_PROFILES_FOLDER_ID,

    scholarship:
        process.env.GOOGLE_DRIVE_SCHOLARSHIP_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,

};


/* =========================================================
   CONTENT TYPE → IMAGE FIELD MAPPING
   ========================================================= */

const DRIVE_UPLOAD_FIELDS = {

    resources: "attachment",

    announcements: "attachment",

    events: "poster",

    tandp: "image",

    courses: "image",

    timetable: "attachment",

    scholarship: "attachment",

};

function getContentUpload(data, contentType) {
    const fieldName = DRIVE_UPLOAD_FIELDS[contentType];
    if (data?.[fieldName]) return data[fieldName];
    if (contentType === "announcements") return data?.image;
    if (contentType === "timetable") return data?.timetableImage;
    return null;
}


/* =========================================================
   GET CONTENT
   ========================================================= */

contentRouter.get(
    "/content/:type",

    requireAuth,

    async (req, res, next) => {

        try {

            const contentType =
                req.params.type;


            /* ---------------------------------------------
               Validate content type
               --------------------------------------------- */

            if (
                !CONTENT_TYPES.includes(
                    contentType
                )
            ) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Unknown content type.",
                    });

            }


            /* ---------------------------------------------
               Get records
               --------------------------------------------- */

            const items =
                await Content
                    .find({
                        type: contentType,
                    })
                    .sort({
                        createdAt: -1,
                    })
                    .lean();


            /* ---------------------------------------------
               Return records
               --------------------------------------------- */

            res.json({

                items: items.map(
                    (item) =>
                        serialize(item)
                ),

            });

        } catch (error) {

            next(error);

        }

    }
);


/* =========================================================
   CREATE CONTENT
   ========================================================= */

contentRouter.post(
    "/content/:type",

    requireAuth,

    requireRole(
        "Class Representative"
    ),

    uploadSingleFile,

    async (req, res, next) => {

        try {

            const contentType =
                req.params.type;


            /* ---------------------------------------------
               Validate content type
               --------------------------------------------- */

            if (
                !CONTENT_TYPES.includes(
                    contentType
                )
            ) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Unknown content type.",
                    });

            }


            /* ---------------------------------------------
               Get normal form fields
               --------------------------------------------- */

            const data = {
                ...req.body,
            };

            const uploadField = DRIVE_UPLOAD_FIELDS[contentType];
            if (req.file && !uploadField) {
                return res.status(400).json({ message: `File uploads are not configured for "${contentType}".` });
            }
            if (req.file) data[uploadField] = { fileId: "pending-upload" };
            if (!isValidContent(contentType, data)) {
                return res.status(400).json({ message: validationMessage(contentType, data) });
            }


            /* ---------------------------------------------
               Handle uploaded image
               --------------------------------------------- */

            if (req.file) {

                const folderId =
                    DRIVE_FOLDER_IDS[
                    contentType
                    ];


                const uploadField =
                    DRIVE_UPLOAD_FIELDS[
                    contentType
                    ];


                /* -----------------------------------------
                   Check Drive folder
                   ----------------------------------------- */

                if (!folderId) {

                    return res
                        .status(500)
                        .json({
                            message:
                                `Google Drive folder is not configured for "${contentType}".`,
                        });

                }


                /* -----------------------------------------
                   Check image field
                   ----------------------------------------- */

                if (!uploadField) {

                    return res
                        .status(400)
                        .json({
                            message:
                                `File uploads are not configured for "${contentType}".`,
                        });

                }


                /* -----------------------------------------
                   Upload to Google Drive
                   ----------------------------------------- */

                const uploadedFile =
                    await uploadFile(
                        req.file,
                        folderId
                    );


                /* -----------------------------------------
                   Store Drive information
                   ----------------------------------------- */

                data[uploadField] = {

                    fileId:
                        uploadedFile.fileId,

                    url:
                        uploadedFile.url,

                    fileName:
                        uploadedFile.fileName,

                    mimeType:
                        uploadedFile.mimeType,

                    size:
                        uploadedFile.size,

                };

            }


            /* ---------------------------------------------
               Validate complete data
               --------------------------------------------- */

            if (
                !isValidContent(
                    contentType,
                    data
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message: validationMessage(contentType, data),
                    });

            }


            /* ---------------------------------------------
               Save to MongoDB
               --------------------------------------------- */

            const item =
                await Content.create({

                    type:
                        contentType,

                    data,

                    createdBy:
                        req.user.sub,

                });


            /* ---------------------------------------------
               Return created item
               --------------------------------------------- */

            res
                .status(201)
                .json({

                    item:
                        serialize(item),

                });

        } catch (error) {

            next(error);

        }

    }
);


/* =========================================================
   UPDATE CONTENT
   ========================================================= */

contentRouter.put(
    "/content/:type/:id",

    requireAuth,

    requireRole(
        "Class Representative"
    ),

    uploadSingleFile,

    async (req, res, next) => {

        try {

            const contentType =
                req.params.type;


            /* ---------------------------------------------
               Validate content type
               --------------------------------------------- */

            if (
                !CONTENT_TYPES.includes(
                    contentType
                )
            ) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Unknown content type.",
                    });

            }


            /* ---------------------------------------------
               Get normal form fields
               --------------------------------------------- */

            const existingItem = await Content.findOne({
                _id: req.params.id,
                type: contentType,
            });

            if (!existingItem) {
                return res
                    .status(404)
                    .json({
                        message: "Record not found.",
                    });
            }

            const existingData =
                existingItem.data && typeof existingItem.data === "object"
                    ? existingItem.data
                    : {};

            const data = {
                ...existingData,
                ...req.body,
            };

            const uploadField = DRIVE_UPLOAD_FIELDS[contentType];
            if (req.file && !uploadField) {
                return res.status(400).json({ message: `File uploads are not configured for "${contentType}".` });
            }
            if (req.file) data[uploadField] = { fileId: "pending-upload" };
            if (!isValidContent(contentType, data)) {
                return res.status(400).json({ message: validationMessage(contentType, data) });
            }


            /* ---------------------------------------------
               Handle new image
               --------------------------------------------- */

            if (req.file) {

                const folderId =
                    DRIVE_FOLDER_IDS[
                    contentType
                    ];


                const uploadField =
                    DRIVE_UPLOAD_FIELDS[
                    contentType
                    ];


                /* -----------------------------------------
                   Check Drive folder
                   ----------------------------------------- */

                if (!folderId) {

                    return res
                        .status(500)
                        .json({
                            message:
                                `Google Drive folder is not configured for "${contentType}".`,
                        });

                }


                /* -----------------------------------------
                   Check image field
                   ----------------------------------------- */

                if (!uploadField) {

                    return res
                        .status(400)
                        .json({
                            message:
                                `File uploads are not configured for "${contentType}".`,
                        });

                }


                /* -----------------------------------------
                   Upload new image
                   ----------------------------------------- */

                const uploadedFile =
                    await uploadFile(
                        req.file,
                        folderId
                    );


                /* -----------------------------------------
                   Store new Drive information
                   ----------------------------------------- */

                data[uploadField] = {

                    fileId:
                        uploadedFile.fileId,

                    url:
                        uploadedFile.url,

                    fileName:
                        uploadedFile.fileName,

                    mimeType:
                        uploadedFile.mimeType,

                    size:
                        uploadedFile.size,

                };

            }


            /* ---------------------------------------------
               Validate updated data
               --------------------------------------------- */

            if (
                !isValidContent(
                    contentType,
                    data
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message: validationMessage(contentType, data),
                    });

            }


            /* ---------------------------------------------
               Update MongoDB
               --------------------------------------------- */

            const item =
                await Content.findOneAndUpdate(

                    {
                        _id:
                            req.params.id,

                        type:
                            contentType,
                    },

                    {
                        data,
                    },

                    {
                        new: true,
                    }

                );


            /* ---------------------------------------------
               Check record
               --------------------------------------------- */

            if (!item) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Record not found.",
                    });

            }


            /* ---------------------------------------------
               Return updated record
               --------------------------------------------- */

            res.json({

                item:
                    serialize(item),

            });

        } catch (error) {

            next(error);

        }

    }
);


/* =========================================================
   DELETE CONTENT
   ========================================================= */

contentRouter.delete(
    "/content/:type/:id",

    requireAuth,

    requireRole(
        "Class Representative"
    ),

    async (req, res, next) => {

        try {

            const item =
                await Content.findOneAndDelete({

                    _id:
                        req.params.id,

                    type:
                        req.params.type,

                });


            /* ---------------------------------------------
               Check record
               --------------------------------------------- */

            if (!item) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Record not found.",
                    });

            }


            /* ---------------------------------------------
               Delete MongoDB record
               --------------------------------------------- */

            res
                .status(204)
                .end();

        } catch (error) {

            next(error);

        }

    }
);

contentRouter.get(
    "/content/:type/:id/image",
    requireAuth,
    async (req, res, next) => {
        try {
            const { type, id } = req.params;
            if (!CONTENT_TYPES.includes(type)) {
                return res.status(404).json({ message: "Unknown content type." });
            }

            const uploadField = DRIVE_UPLOAD_FIELDS[type];
            if (!uploadField) {
                return res.status(404).json({ message: "This content type has no uploaded file." });
            }

            const item = await Content.findOne({ _id: id, type }).lean();
            if (!item) {
                return res.status(404).json({ message: "Record not found." });
            }

            const fileId = getStoredFileId(getContentUpload(item.data, type));
            if (!fileId) {
                return res.status(404).json({ message: "Image file not found." });
            }

            const image = await downloadFile(fileId);
            if (!image.mimeType.toLowerCase().startsWith("image/")) {
                image.stream.destroy();
                return res.status(415).json({ message: "The stored file is not an image." });
            }

            res.setHeader("Content-Type", image.mimeType);
            res.setHeader("Cache-Control", "private, max-age=3600");
            res.setHeader("X-Content-Type-Options", "nosniff");
            if (image.contentLength) {
                res.setHeader("Content-Length", image.contentLength);
            }

            image.stream.on("error", (error) => {
                if (res.headersSent) {
                    res.destroy(error);
                } else {
                    next(error);
                }
            });
            image.stream.pipe(res);
        } catch (error) {
            next(error);
        }
    }
);

contentRouter.get(
    "/content/:type/:id/file",
    requireAuth,
    async (req, res, next) => {
        try {
            const { type, id } = req.params;
            if (!CONTENT_TYPES.includes(type)) {
                return res.status(404).json({ message: "Unknown content type." });
            }

            const item = await Content.findOne({ _id: id, type }).lean();
            if (!item) return res.status(404).json({ message: "Record not found." });

            const storedFile = getContentUpload(item.data, type);
            const fileId = getStoredFileId(storedFile);
            if (!fileId) return res.status(404).json({ message: "Uploaded file not found." });

            const file = await downloadFile(fileId);
            const filename = String(storedFile?.fileName || "download").replace(/[\r\n]/g, "").trim() || "download";
            const fallbackFilename = filename.replace(/[^A-Za-z0-9._ -]/g, "_").replace(/["\\]/g, "_");
            const encodedFilename = encodeURIComponent(filename).replace(/['()*]/g, (character) =>
                `%${character.charCodeAt(0).toString(16).toUpperCase()}`
            );
            res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
            res.setHeader("Content-Disposition", `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`);
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Cache-Control", "private, max-age=3600");
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
);
