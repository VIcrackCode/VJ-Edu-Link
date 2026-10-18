import "dotenv/config";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

const CREDENTIALS_PATH = process.env.GOOGLE_OAUTH_CREDENTIALS_FILE
    ? path.resolve(process.env.GOOGLE_OAUTH_CREDENTIALS_FILE)
    : null;

const TOKEN_PATH = process.env.GOOGLE_OAUTH_TOKEN_FILE
    ? path.resolve(process.env.GOOGLE_OAUTH_TOKEN_FILE)
    : null;

const SCOPES = [
    "https://www.googleapis.com/auth/drive",
];

function createDriveClient() {
    if (!CREDENTIALS_PATH || !TOKEN_PATH) {
        throw new Error(
            "Set GOOGLE_OAUTH_CREDENTIALS_FILE and GOOGLE_OAUTH_TOKEN_FILE in server/.env to enable Google Drive uploads."
        );
    }

    const credentials = JSON.parse(
        fs.readFileSync(CREDENTIALS_PATH, "utf8")
    );

    const config = credentials.installed || credentials.web;

    if (!config) {
        throw new Error(
            "Invalid Google OAuth credentials file."
        );
    }

    const token = JSON.parse(
        fs.readFileSync(TOKEN_PATH, "utf8")
    );

    const auth = new google.auth.OAuth2(
        config.client_id,
        config.client_secret,
        config.redirect_uris?.[0] || "http://localhost"
    );

    auth.setCredentials(token);

    return google.drive({
        version: "v3",
        auth,
    });
}

export async function uploadImage(file, folderId) {
    if (!file) {
        throw new Error("No image file was provided.");
    }

    if (!folderId) {
        throw new Error("Google Drive folder ID is missing.");
    }

    const drive = createDriveClient();

    const response = await drive.files.create({
        requestBody: {
            name: file.originalname,
            parents: [folderId],
        },
        media: {
            mimeType: file.mimetype,
            body: Readable.from(file.buffer),
        },
        fields: "id,name,mimeType,size",
    });

    const fileId = response.data.id;

    if (!fileId) {
        throw new Error(
            "Google Drive did not return a file ID."
        );
    }

    await drive.permissions.create({
        fileId,
        requestBody: {
            type: "anyone",
            role: "reader",
        },
    });

    const url =
        `https://drive.google.com/uc?export=view&id=${fileId}`;

    return {
        fileId,
        fileName: response.data.name,
        mimeType: response.data.mimeType,
        size: response.data.size,
        url,
    };
}

export async function downloadImage(fileId) {
    if (!fileId) {
        throw new Error("A Google Drive file ID is required.");
    }

    const drive = createDriveClient();
    const metadata = await drive.files.get({
        fileId,
        fields: "mimeType",
        supportsAllDrives: true,
    });

    const response = await drive.files.get(
        {
            fileId,
            alt: "media",
            supportsAllDrives: true,
        },
        { responseType: "stream" }
    );

    return {
        stream: response.data,
        mimeType:
            metadata.data.mimeType ||
            response.headers?.["content-type"]?.split(";")[0] ||
            "",
        contentLength: response.headers?.["content-length"] || "",
    };
}
