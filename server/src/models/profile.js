import { Schema, model } from "mongoose";

const profileSchema = new Schema({
    ownerId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    ownerCollegeId: { type: String, required: true, uppercase: true, index: true },
    profileName: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
}, { timestamps: true, collection: "profiles" });

export const Profile = model("Profile", profileSchema);
