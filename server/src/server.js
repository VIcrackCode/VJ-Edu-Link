import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/db.js";
import { authRouter } from "./routes/auth.js";
import { contentRouter } from "./routes/content.js";
import { profileRouter } from "./routes/profiles.js";
import { studentRouter } from "./routes/students.js";
import { timetableImageRouter } from "./routes/timetableImage.js";

const app = express();
const uri = process.env.MONGODB_URI ;
const port = Number(process.env.MONGODB_PORT) ;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "vj-edu-link" });
});

app.use("/api", authRouter);
app.use("/api", contentRouter);
app.use("/api", profileRouter);
app.use("/api", studentRouter);
app.use("/api", timetableImageRouter);

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ success: false, message: "An unexpected server error occurred." });
});

async function start() {
    if (!process.env.JWT_SECRET) {
        throw new Error("Set JWT_SECRET in server/.env");
    }
    await connectDatabase(uri);
    app.listen(port, () => {
        console.log(`API listening on http://localhost:${port}`);
    });
}

start().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
