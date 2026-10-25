import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/db.js";
import { authRouter } from "./routes/auth.js";
import { contentRouter } from "./routes/content.js";
import { profileRouter } from "./routes/profiles.js";
import { studentRouter } from "./routes/students.js";
import { timetableImageRouter } from "./routes/timetableImage.js";
import { adminRouter } from "./routes/admin.js";

const app = express();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
const configuredPort = Number(process.env.PORT);
const port = Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : 3000;
const clientOrigins = String(process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (clientOrigins.length === 0 && process.env.NODE_ENV !== "production") {
    clientOrigins.push("http://localhost:5173");
}

app.use(cors({ origin: clientOrigins }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "vj-edu-link" });
});

app.use("/api", authRouter);
app.use("/api", contentRouter);
app.use("/api", profileRouter);
app.use("/api", studentRouter);
app.use("/api", timetableImageRouter);
app.use("/api", adminRouter);

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ success: false, message: "An unexpected server error occurred." });
});

async function start() {
    if (!uri) {
        throw new Error("Set MONGO_URI (or MONGODB_URI) in the server environment.");
    }
    if (!process.env.JWT_SECRET) {
        throw new Error("Set JWT_SECRET in the server environment.");
    }
    if (clientOrigins.length === 0) {
        throw new Error("Set CLIENT_ORIGIN to the deployed client URL in the server environment.");
    }
    await connectDatabase(uri);
    const server = app.listen(port, "0.0.0.0", () => {
        const address = server.address();
        const activePort = typeof address === "object" && address ? address.port : port;
        console.log(`API listening on port ${activePort}`);
    });
}

start().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
