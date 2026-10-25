
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const credentialsPath = path.join(
  process.cwd(),
  "config",
  "google-oauth-credentials.json"
);

const tokenPath = path.join(
  process.cwd(),
  "tokens",
  "google-token.json"
);

async function verifyToken() {
  const credentials = JSON.parse(
    fs.readFileSync(credentialsPath, "utf8")
  );

  const tokens = JSON.parse(
    fs.readFileSync(tokenPath, "utf8")
  );

  const config = credentials.web;

  if (!config) {
    throw new Error("Web OAuth credentials not found.");
  }

  if (!tokens.refresh_token) {
    throw new Error("Refresh token is missing.");
  }

  const oauth2Client = new google.auth.OAuth2(
    config.client_id,
    config.client_secret,
    config.redirect_uris?.[0]
  );

  oauth2Client.setCredentials(tokens);

  // Ask Google for a valid access token.
  const result = await oauth2Client.getAccessToken();

  if (!result.token) {
    throw new Error("Google did not return an access token.");
  }

  // Preserve the refresh token and save updated credentials.
  const updatedTokens = {
    ...tokens,
    ...oauth2Client.credentials
  };

  fs.writeFileSync(
    tokenPath,
    JSON.stringify(updatedTokens, null, 2),
    { mode: 0o600 }
  );

  console.log("SUCCESS: Google accepted the refresh token.");
  console.log("Access token obtained successfully.");
  console.log("Updated token file saved.");
}

verifyToken().catch((error) => {
  console.error(
    "FAILED:",
    error.response?.data?.error || error.message
  );
  process.exitCode = 1;
});
