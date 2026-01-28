import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length) return;
  admin.initializeApp();
}

export function getDb() {
  initAdmin();
  return admin.firestore();
}
