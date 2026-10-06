# 🩸 Blood Bank Connect

A full-stack blood donor portal built with Node.js, Express, Firebase Firestore and Bootstrap.

## 🚀 Easiest deployment: Render + Firebase

This project is designed to deploy as **one Render Web Service**. The Express server serves both the API and the `frontend/` folder.

### 1. Create Firebase / Firestore

1. Open the Firebase Console.
2. Create a Firebase project.
3. Create a **Cloud Firestore database** in Native mode.
4. Go to **Project settings → Service accounts → Generate new private key**.
5. Download the JSON key. Keep it private.

Recommended Firestore rules when the database is used only through this server:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

The Firebase Admin SDK used by the backend bypasses client Firestore rules.

### 2. Upload to GitHub

Upload the contents of this project to a GitHub repository. Do **not** upload:

- `backend/.env`
- `backend/serviceAccountKey.json`
- any Firebase service-account JSON

The `.gitignore` already protects these files.

### 3. Deploy on Render

Create **New → Web Service**, connect the GitHub repository, and use:

- Runtime: `Node`
- Root Directory: `backend`
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/api/health`

The included `render.yaml` can also be used as the deployment blueprint.

### 4. Add Firebase credentials in Render

Add these environment variables:

```text
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={paste the complete service-account JSON}
```

Also set a strong `JWT_SECRET` if Render did not generate one automatically.

Example:

```text
NODE_ENV=production
JWT_EXPIRE=7d
JWT_SECRET=<long-random-secret>
```

Do not put quotes around the JSON value unless Render's editor requires them. The application accepts the complete JSON object as one environment-variable value and restores escaped newlines in `private_key`.

### 5. Test

After deployment, open:

```text
https://YOUR-RENDER-DOMAIN/api/health
```

Expected response:

```json
{"status":"OK","time":"..."}
```

Then open the Render URL itself. The same server serves the website.

## Local development

```bash
cd backend
npm install
cp .env.example .env
```

For local Firebase credentials, download the service-account JSON and set:

```text
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
JWT_SECRET=your-long-random-secret
```

Then:

```bash
npm run check
npm start
```

Open `http://localhost:5000`.

## Main API

- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/users/donors`
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `PATCH /api/users/availability`
- `GET /api/requests`
- `POST /api/requests`
- `GET /api/requests/mine`
- `DELETE /api/requests/:id`
- `PATCH /api/requests/:id/fulfill`
- `GET /api/health`

## Important fixes in this version

- Firestore document IDs consistently use `id` instead of MongoDB `_id`.
- Cloud Firebase authentication works with `FIREBASE_SERVICE_ACCOUNT_KEY`.
- Existing documents without `available` or `fulfilled` continue to work.
- JWT expiry respects `JWT_EXPIRE`.
- Stronger server-side validation for users and blood requests.
- Past request dates are rejected.
- Expired browser sessions are cleared automatically.
- Dynamic frontend content is escaped before rendering.
- API 404s return JSON instead of the frontend HTML.
- Render proxy support and health checks are configured.
- Secrets are excluded from Git.
