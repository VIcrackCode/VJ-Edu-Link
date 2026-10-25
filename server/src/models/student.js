import { Schema, model } from "mongoose";

const studentSchema = new Schema({
    role: {
        type: String,
        enum: ["Student", "Class Representative", "Admin"],
        default: "Student",
        required: true,
    },
    collegeId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        minlength: 10,
        maxlength: 10,
        match: [/^[0-9]{2}[0-9]{3}[A-Z][0-9]{4}$/, "College ID must look like 25071A0001"],
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, match: /^\d{10}$/ },
    year: { type: String, required: true },
    branch: { type: String, required: true },
    section: { type: String, required: true },
    profileImage: { type: Schema.Types.Mixed, default: null },
    password: { type: String, required: true },
}, { timestamps: true, collection: "students" });

export const Student = model("Student", studentSchema);
