import { Router } from "express";
import { Profile } from "../models/profile.js";
import { Student } from "../models/student.js";
import { requireAuth } from "../middleware/auth.js";

export const profileRouter = Router();

function serialize(doc) {
    return {
        id: String(doc._id),
        ownerCollegeId: doc.ownerCollegeId,
        profileName: doc.profileName,
        url: doc.url,
    };
}

profileRouter.get("/profiles", requireAuth, async (req, res, next) => {
    try {
        const collegeId = String(req.query.collegeId || req.user.collegeId || "").trim().toUpperCase();
        const items = await Profile.find({ ownerCollegeId: collegeId }).sort({ createdAt: -1 });
        const owner = await Student.findOne({ collegeId }).select("collegeId name role branch section year");
        res.json({
            owner: owner ? {
                collegeId: owner.collegeId,
                name: owner.name,
                role: owner.role,
                branch: owner.branch,
                section: owner.section,
                year: owner.year,
            } : null,
            items: items.map(serialize),
        });
    } catch (error) {
        next(error);
    }
});

profileRouter.post("/profiles", requireAuth, async (req, res, next) => {
    try {
        const profileName = String(req.body.profileName || "").trim();
        const url = String(req.body.url || "").trim();
        if (!profileName || !url) {
            return res.status(400).json({ message: "Profile name and URL are required." });
        }
        const owner = await Student.findById(req.user.sub);
        const item = await Profile.create({
            ownerId: owner._id,
            ownerCollegeId: owner.collegeId,
            profileName,
            url,
        });
        res.status(201).json({ item: serialize(item) });
    } catch (error) {
        next(error);
    }
});

profileRouter.delete("/profiles/:id", requireAuth, async (req, res, next) => {
    try {
        const item = await Profile.findOneAndDelete({ _id: req.params.id, ownerId: req.user.sub });
        if (!item) return res.status(404).json({ message: "Profile not found." });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});
