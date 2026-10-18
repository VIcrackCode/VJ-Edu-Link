import { Schema, model } from "mongoose";

const timetableImageSchema = new Schema({
    _id: { type: String, default: "class-timetable" },
    image: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Student", required: true },
}, { timestamps: true, collection: "timetableimages" });

export const TimetableImage = model("TimetableImage", timetableImageSchema);
