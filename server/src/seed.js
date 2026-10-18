import "dotenv/config";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { connectDatabase } from "./config/db.js";
import { Student } from "./models/student.js";
import { Content } from "./models/content.js";
import { Profile } from "./models/profile.js";

const password = "Password123";

async function seed() {
    await connectDatabase(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vjedulink");
    await mongoose.connection.dropDatabase();
    const hashed = await hash(password, 12);

    const [cr, student] = await Student.create([
        {
            role: "Class Representative",
            collegeId: "25071A0001",
            name: "CR Student",
            phone: "9876543210",
            year: "II",
            branch: "CSE",
            section: "A",
            password: hashed,
        },
        {
            role: "Student",
            collegeId: "25071A0002",
            name: "Regular Student",
            phone: "9876543211",
            year: "II",
            branch: "CSE",
            section: "A",
            password: hashed,
        },
    ]);

    await Content.insertMany([
        { type: "resources", createdBy: cr._id, data: { category: "Theory", subject: "DBMS", documentType: "Materials", documentLink: "https://drive.google.com" } },
        { type: "resources", createdBy: cr._id, data: { category: "Theory", subject: "DBMS", documentType: "Question Papers", documentLink: "https://drive.google.com" } },
        { type: "resources", createdBy: cr._id, data: { category: "Theory", subject: "DBMS", documentType: "Syllabus", documentLink: "https://drive.google.com" } },
        { type: "resources", createdBy: cr._id, data: { category: "Lab", subject: "DBMS LAB", documentType: "Lab Documents", documentLink: "https://drive.google.com" } },
        { type: "announcements", createdBy: cr._id, data: { category: "Exams", title: "Mid-semester schedule", description: "The class test timetable has been published.", documentLink: "https://drive.google.com" } },
        { type: "tandp", createdBy: cr._id, data: { image: "/poster.jpeg", title: "Placement preparation session", description: "Resume review and interview practice this Friday." } },
        { type: "courses", createdBy: cr._id, data: { courseName: "Database Management Systems", suggestedBy: "Class Representative", description: "Suggested study plan and resources.", courseLink: "https://drive.google.com", image: "/poster.jpeg" } },
        { type: "events", createdBy: cr._id, data: { organizer: "Convergence", venue: "E-Block", time: "Friday, 2:00 PM", eventType: "Technical", registrationLink: "https://example.com", poster: "/poster.jpeg" } },
        { type: "timetable", createdBy: cr._id, data: { update: "COA class cancelled", period: "Friday, 10:00 AM - 11:00 AM", reason: "Department event", timetableImage: "/CSE_A_TimeTable.jpg" } },
        { type: "scholarship", createdBy: cr._id, data: { title: "E-PASS renewal", description: "E-PASS renewal applications are open.", deadline: "2026-11-30" } },
    ]);

    await Profile.create([
        { ownerId: student._id, ownerCollegeId: student.collegeId, profileName: "LinkedIn", url: "https://linkedin.com" },
        { ownerId: cr._id, ownerCollegeId: cr.collegeId, profileName: "GitHub", url: "https://github.com" },
    ]);

    console.log("Seed complete. Database: vjedulink");
    console.log("Class Representative  25071A0001  /  Password123");
    console.log("Student               25071A0002  /  Password123");
    process.exit(0);
}

seed().catch((error) => {
    console.error(error);
    process.exit(1);
});
