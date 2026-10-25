import { Schema, model } from "mongoose";

const passwordResetSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
}, { timestamps: true, collection: "passwordresets" });

export const PasswordReset = model("PasswordReset", passwordResetSchema);
