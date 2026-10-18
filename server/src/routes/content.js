import { Router } from "express";
import multer from "multer";

import { Content, CONTENT_TYPES } from "../models/content.js";
import { isValidContent } from "../models/contentRules.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { downloadImage, uploadImage } from "../utils/googleDrive.js";

export const contentRouter = Router();


/* =========================================================
   MULTER UPLOAD CONFIGURATION
   ========================================================= */

const upload = multer({

    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },

    fileFilter: (req, file, cb) => {

        if (file.mimetype.startsWith("image/")) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only image files are allowed."
                )
            );

        }

    },

});


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

};


/* =========================================================
   CONTENT TYPE → IMAGE FIELD MAPPING
   ========================================================= */

const DRIVE_IMAGE_FIELDS = {

    announcements: "image",

    events: "poster",

    tandp: "image",

    courses: "image",

    timetable: "timetableImage",

    profiles: "image",

};


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

    upload.single("file"),

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


            /* ---------------------------------------------
               Handle uploaded image
               --------------------------------------------- */

            if (req.file) {

                const folderId =
                    DRIVE_FOLDER_IDS[
                    contentType
                    ];


                const imageField =
                    DRIVE_IMAGE_FIELDS[
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

                if (!imageField) {

                    return res
                        .status(400)
                        .json({
                            message:
                                `Image uploads are not configured for "${contentType}".`,
                        });

                }


                /* -----------------------------------------
                   Upload to Google Drive
                   ----------------------------------------- */

                const uploadedFile =
                    await uploadImage(
                        req.file,
                        folderId
                    );


                /* -----------------------------------------
                   Store Drive information
                   ----------------------------------------- */

                data[imageField] = {

                    fileId:
                        uploadedFile.fileId,

                    url:
                        uploadedFile.url,

                    fileName:
                        uploadedFile.fileName,

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
                        message:
                            "All required fields must be provided.",
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

    upload.single("file"),

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


            /* ---------------------------------------------
               Handle new image
               --------------------------------------------- */

            if (req.file) {

                const folderId =
                    DRIVE_FOLDER_IDS[
                    contentType
                    ];


                const imageField =
                    DRIVE_IMAGE_FIELDS[
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

                if (!imageField) {

                    return res
                        .status(400)
                        .json({
                            message:
                                `Image uploads are not configured for "${contentType}".`,
                        });

                }


                /* -----------------------------------------
                   Upload new image
                   ----------------------------------------- */

                const uploadedFile =
                    await uploadImage(
                        req.file,
                        folderId
                    );


                /* -----------------------------------------
                   Store new Drive information
                   ----------------------------------------- */

                data[imageField] = {

                    fileId:
                        uploadedFile.fileId,

                    url:
                        uploadedFile.url,

                    fileName:
                        uploadedFile.fileName,

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
                        message:
                            "All required fields must be provided.",
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

            const imageField = DRIVE_IMAGE_FIELDS[type];
            if (!imageField) {
                return res.status(404).json({ message: "This content type has no image." });
            }

            const item = await Content.findOne({ _id: id, type }).lean();
            if (!item) {
                return res.status(404).json({ message: "Record not found." });
            }

            const fileId = getStoredFileId(item.data?.[imageField]);
            if (!fileId) {
                return res.status(404).json({ message: "Image file not found." });
            }

            const image = await downloadImage(fileId);
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
