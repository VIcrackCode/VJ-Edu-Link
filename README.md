# VJ Edu Link

Class portal for VNR VJIET-style college IDs. Students view shared class content, and Class Representatives publish it. MongoDB stores accounts, profiles, and content.

## Project layout

- `client` — React + Vite frontend
- `server` — Express + MongoDB API
- `render.yaml` — Render Blueprint for the client and API services
- `client/.env.example` and `server/.env.example` — safe environment templates

## Run locally

1. Install [Node.js](https://nodejs.org/) and [MongoDB Community](https://www.mongodb.com/try/download/community) (or use MongoDB Atlas).
2. Keep MongoDB running. Compass can connect to `mongodb://127.0.0.1:27017`.
3. From this folder, install the dependencies and copy the server environment template:

```bash
npm ci
npm ci --prefix client
npm ci --prefix server
cp server/.env.example server/.env
```

Set `MONGO_URI` and replace `JWT_SECRET` in `server/.env`, then run:

```bash
npm run seed
npm run dev
```

- API: http://localhost:3000/api/health
- App: http://localhost:5173

`npm run seed` deletes all data in the configured database before adding sample records. Use it only with a development database; do not run it against production.

### Seed logins

| Role | College ID | Password | Phone |
| --- | --- | --- | --- |
| Class Representative | 25071A0001 | Password123 | 9876543210 |
| Student | 25071A0002 | Password123 | 9876543211 |

Forgot-password OTP is displayed in the app only when `NODE_ENV=development`.

The API can start without Google Drive configured. For local uploads, set the OAuth credential and token file paths plus Drive folder IDs in `server/.env`. To create the first Admin without clearing data, set `ADMIN_COLLEGE_ID`, `ADMIN_NAME`, `ADMIN_PHONE`, and `ADMIN_PASSWORD`, then run `npm run admin:create`. The password is hashed in MongoDB. Admin sign-ins open `/admin`, where accounts can be managed.

## Deploy to Render

The root `render.yaml` defines two services:

- `vj-edu-link-api` — Express web service, with `/api/health` as its health check
- `vj-edu-link-client` — Vite static site, with a rewrite for React Router deep links

1. Push this repository to GitHub, then in Render choose **New > Blueprint** and connect the repository containing `render.yaml`.
2. Create a MongoDB Atlas database, add the Render service's outbound network access in Atlas, and provide its connection string when Render prompts for `MONGO_URI`. The database user and password in the URI must be URL-encoded if they contain special characters.
3. Render generates `JWT_SECRET`. The Blueprint sets `NODE_ENV=production`, allows the client origin `https://vj-edu-link-client.onrender.com`, and builds the client with `VITE_API_BASE_URL=https://vj-edu-link-api.onrender.com/api`.
4. Wait for both services to deploy. Check `https://vj-edu-link-api.onrender.com/api/health`, then open `https://vj-edu-link-client.onrender.com`.

The API and client service names in `render.yaml` determine those Render URLs. If you change a service name or use a custom client domain, update `VITE_API_BASE_URL` on the static site and `CLIENT_ORIGIN` on the API. `CLIENT_ORIGIN` accepts a comma-separated list of allowed client origins. Static-site environment variables are embedded during the build, so redeploy the client after changing its API URL.

### Production environment variables

The Blueprint prompts for `MONGO_URI` and generates `JWT_SECRET`. Do not put real credentials in `render.yaml`, `.env.example`, or source code. `.gitignore` excludes local environment files, Google credential JSON files, and token files.

Google Drive uploads are optional. To enable them, add `GOOGLE_OAUTH_CREDENTIALS_JSON` and `GOOGLE_OAUTH_TOKEN_JSON` to the API service's Render environment using the contents of your OAuth credential and token JSON files. Also add the relevant `GOOGLE_DRIVE_*_FOLDER_ID` variables. The JSON environment variables are supported for Render, where local credential files are not deployed.

Create the first production Admin by temporarily setting `ADMIN_COLLEGE_ID`, `ADMIN_NAME`, `ADMIN_PHONE`, and `ADMIN_PASSWORD` on the API service, then run `npm run admin:create` from the service shell. Remove `ADMIN_PASSWORD` from the service environment after the account has been created. Never use `npm run seed` on the production database.

## Push to GitHub

Create an empty repository on GitHub, then from this folder:

```bash
git add .
git commit -m "Prepare VJ Edu Link for deployment"
git remote add origin https://github.com/<your-account>/<your-repository>.git
git push -u origin main
```

Review `git status` before committing. The local `.env` files and Google credentials are ignored; keep them out of GitHub.

## MongoDB Compass

1. Open Compass and connect to `mongodb://127.0.0.1:27017`.
2. Open database `vjedulink`.
3. Collections:
   - `students` — accounts (`collegeId`, hashed `password`, `role`, `phone`)
   - `contents` — class records; `type` is `resources`, `announcements`, `tandp`, `courses`, `events`, `timetable`, or `scholarship`; payload is in `data`
   - `profiles` — public links owned by a student
   - `passwordresets` — short-lived OTP hashes (auto-expire)
4. Do not edit password hashes by hand. Create accounts from **Manage Accounts** or run `npm run seed` against the development database.
5. To test the student view, insert or update a `contents` document, then refresh the matching page while logged in as `25071A0002`.
6. To test the CR flow, log in as `25071A0001`, add/edit/delete from **Manage**, then confirm the same document in Compass.
