
import "dotenv/config";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const credentialsPath = path.resolve(
  process.env.GOOGLE_OAUTH_CREDENTIALS_FILE
);

const tokenPath = path.resolve(
  process.env.GOOGLE_OAUTH_TOKEN_FILE
);

async function refreshToken() {
  const credentials = JSON.parse(
    fs.readFileSync(credentialsPath, "utf8")
  );

  const config = credentials.installed || credentials.web;

  const token = JSON.parse(
    fs.readFileSync(tokenPath, "utf8")
  );

  const auth = new google.auth.OAuth2(
    config.client_id,
    config.client_secret,
    config.redirect_uris?.[0] || "http://localhost"
  );

  auth.setCredentials(token);

  const accessToken = await auth.getAccessToken();

  if (!accessToken.token) {
    throw new Error("No access token returned.");
  }

  fs.writeFileSync(
    tokenPath,
    JSON.stringify(
      { ...token, ...auth.credentials },
      null,
      2
    ),
    { mode: 0o600 }
  );

  console.log("Access token refreshed successfully.");
  console.log("Updated expiry:", auth.credentials.expiry_date);
}

refreshToken().catch((error) => {
  console.error(
    "Refresh failed:",
    error.response?.data || error.message
  );
  process.exitCode = 1;
});
