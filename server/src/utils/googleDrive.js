
import "dotenv/config";
import { google } from "googleapis";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

const CREDENTIALS_PATH = process.env.GOOGLE_OAUTH_CREDENTIALS_FILE
    ? path.resolve(process.env.GOOGLE_OAUTH_CREDENTIALS_FILE)
    : null;

const TOKEN_PATH = process.env.GOOGLE_OAUTH_TOKEN_FILE
    ? path.resolve(process.env.GOOGLE_OAUTH_TOKEN_FILE)
    : null;

function createDriveClient() {
    const credentials = readJsonConfig(
        "GOOGLE_OAUTH_CREDENTIALS_JSON",
        CREDENTIALS_PATH,
        "Google OAuth credentials"
    );

    const config = credentials.web || credentials.installed;

    if (!config) {
        throw new Error(
            "Invalid Google OAuth credentials file."
        );
    }

    const token = readJsonConfig(
        "GOOGLE_OAUTH_TOKEN_JSON",
        TOKEN_PATH,
        "Google OAuth token"
    );

    if (!token.refresh_token) {
        throw new Error(
            "Refresh token is missing. Reauthorize Google OAuth."
        );
    }

    const auth = new google.auth.OAuth2(
        config.client_id,
        config.client_secret,
        process.env.GOOGLE_OAUTH_REDIRECT_URI ||
            config.redirect_uris?.[0] ||
            "http://localhost:3001/oauth2callback"
    );

    auth.setCredentials(token);

    // Save new credentials whenever Google refreshes the token.
    auth.on("tokens", (newTokens) => {
        // Environment-provided secrets are read-only. Google refreshes access
        // tokens from the refresh token without needing to persist them here.
        if (!TOKEN_PATH || process.env.GOOGLE_OAUTH_TOKEN_JSON) return;

        try {
            const currentTokens = JSON.parse(
                fs.readFileSync(TOKEN_PATH, "utf8")
            );

            const updatedTokens = {
                ...currentTokens,
                ...newTokens,
            };

            fs.writeFileSync(
                TOKEN_PATH,
                JSON.stringify(updatedTokens, null, 2),
                { mode: 0o600 }
            );

            console.log(
                "Google OAuth tokens updated successfully."
            );
        } catch (error) {
            console.error(
                "Failed to save Google OAuth tokens:",
                error.message
            );
        }
    });

    return google.drive({
        version: "v3",
        auth,
    });
}

function readJsonConfig(envName, filePath, description) {
    const rawJson = process.env[envName];
    if (rawJson) {
        try {
            return JSON.parse(rawJson);
        } catch {
            throw new Error(`${envName} must contain valid JSON.`);
        }
    }

    if (!filePath) {
        throw new Error(`Set ${envName} or configure the corresponding local file path.`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`${description} file was not found.`);
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export async function uploadImage(file, folderId) {
    if (!String(file?.mimetype || "").startsWith("image/")) {
        throw new Error("An image file is required.");
    }
    return uploadFile(file, folderId);
}

export async function uploadFile(file, folderId) {
    if (!file?.buffer || !file.originalname || !file.mimetype) {
        throw new Error(
            "A valid uploaded file is required."
        );
    }

    if (!folderId) {
        throw new Error(
            "Google Drive folder ID is missing."
        );
    }

    const drive = createDriveClient();

    const response = await drive.files.create({
        requestBody: {
            name: path.basename(file.originalname),
            parents: [folderId],
        },
        media: {
            mimeType: file.mimetype,
            body: Readable.from([file.buffer]),
        },
        fields: "id,name,mimeType,size",
    });

    const fileId = response.data.id;

    if (!fileId) {
        throw new Error(
            "Google Drive did not return a file ID."
        );
    }

    // Makes the uploaded file publicly readable.
    // Keep this only if the uploaded content is intended to be public.
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

export async function downloadFile(fileId) {
    if (!fileId) {
        throw new Error(
            "A Google Drive file ID is required."
        );
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
        {
            responseType: "stream",
        }
    );

    return {
        stream: response.data,
        mimeType:
            metadata.data.mimeType ||
            response.headers?.["content-type"]?.split(";")[0] ||
            "",
        contentLength:
            response.headers?.["content-length"] || "",
    };
}

export const downloadImage = downloadFile;
