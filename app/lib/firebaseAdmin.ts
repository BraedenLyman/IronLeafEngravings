import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length) return admin.app();

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (json) {
    const serviceAccount = JSON.parse(json);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const adminApp = initAdmin();
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
