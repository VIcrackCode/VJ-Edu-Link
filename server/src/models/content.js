import { Schema, model } from "mongoose";

export const CONTENT_TYPES = [
    "resources",
    "announcements",
    "tandp",
    "courses",
    "events",
    "timetable",
    "scholarship",
];

const contentSchema = new Schema({
    type: { type: String, enum: CONTENT_TYPES, required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "Student", required: true },
}, { timestamps: true, collection: "contents" });

export const Content = model("Content", contentSchema);
