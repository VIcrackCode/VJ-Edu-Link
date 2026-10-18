import "dotenv/config";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { authenticate } from "@google-cloud/local-auth";

const CREDENTIALS_PATH = path.resolve(
    process.env.GOOGLE_OAUTH_CREDENTIALS_FILE
);

const TOKEN_PATH = path.resolve(
    process.env.GOOGLE_OAUTH_TOKEN_FILE
);

const SCOPES = [
    "https://www.googleapis.com/auth/drive",
];

async function authorize() {
    console.log("\nStarting Google Drive authorization...\n");

    const auth = await authenticate({
        keyfilePath: CREDENTIALS_PATH,
        scopes: SCOPES,
    });

    fs.mkdirSync(path.dirname(TOKEN_PATH), {
        recursive: true,
    });

    fs.writeFileSync(
        TOKEN_PATH,
        JSON.stringify(auth.credentials, null, 2)
    );

    console.log("\n========================================");
    console.log("SUCCESS!");
    console.log("Google OAuth token saved to:");
    console.log(TOKEN_PATH);
    console.log("========================================\n");
}

authorize().catch((error) => {
    console.error("\nOAuth authorization failed:");
    console.error(error);
    process.exit(1);
});