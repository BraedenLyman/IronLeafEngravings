import admin from "firebase-admin";
import fs from "fs";
import path from "path";

function loadServiceAccount(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function initAdmin() {
  if (admin.apps.length) return admin.app();

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const serviceAccount = JSON.parse(json);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const envAccount = envPath ? loadServiceAccount(envPath) : null;
  if (envAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(envAccount),
    });
  }

  const localAccount = loadServiceAccount(path.join(process.cwd(), "serviceAccount.json"));
  if (localAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(localAccount),
    });
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const adminApp = initAdmin();
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
