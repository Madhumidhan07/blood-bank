const admin = require('firebase-admin');
process.env.FIREBASE_PROJECT_ID

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  } catch (err) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Paste the full Firebase service-account JSON into the environment variable.');
  }
}

function initFirebase() {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required.');

  const serviceAccount = getServiceAccount();
  const options = { projectId };

  if (serviceAccount) {
    options.credential = admin.credential.cert(serviceAccount);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    options.credential = admin.credential.applicationDefault();
  } else {
    throw new Error('Firebase credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_KEY for Render/cloud deployment, or GOOGLE_APPLICATION_CREDENTIALS for local development.');
  }

  admin.initializeApp(options);
  console.log(`Firebase (Firestore) connected: ${projectId}`);
  return admin.app();
}

initFirebase();
const db = admin.firestore();

module.exports = { admin, db };
