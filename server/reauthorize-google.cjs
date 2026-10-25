
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const { google } = require("googleapis");

const app = express();
const PORT = 3001;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const credentialsPath = path.join(
  __dirname, "config", "google-oauth-credentials.json"
);
const tokenPath = path.join(
  __dirname, "tokens", "google-token.json"
);

const credentials = JSON.parse(
  fs.readFileSync(credentialsPath, "utf8")
);
const config = credentials.web;

if (!config) {
  throw new Error("Web OAuth credentials not found.");
}

const SCOPES = [
  "https://www.googleapis.com/auth/drive"
];

const oauth2Client = new google.auth.OAuth2(
  config.client_id,
  config.client_secret,
  REDIRECT_URI
);

const state = crypto.randomBytes(32).toString("hex");

app.get("/", (req, res) => {
  res.redirect(
    oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: true,
      scope: SCOPES,
      state
    })
  );
});

app.get("/oauth2callback", async (req, res) => {
  if (req.query.state !== state) {
    return res.status(403).send("Invalid OAuth state.");
  }

  if (req.query.error) {
    return res.status(400).send("Google authorization was denied.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);

    if (!tokens.refresh_token) {
      return res.status(400).send(
        "No refresh token received. Check OAuth consent and try again."
      );
    }

    fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
    fs.writeFileSync(
      tokenPath,
      JSON.stringify(tokens, null, 2),
      { mode: 0o600 }
    );

    console.log("Google OAuth tokens saved successfully.");
    res.send("Authorization successful! You can close this tab.");
    server.close();
  } catch (error) {
    console.error(
      "OAuth error:",
      error.response?.data?.error || error.message
    );
    res.status(500).send("Authorization failed. Check the terminal.");
  }
});

const server = app.listen(PORT, () => {
  console.log(`Open http://localhost:${PORT} in your browser`);
});
