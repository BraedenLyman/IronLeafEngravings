import admin from "firebase-admin";

if (!admin.apps.length) {
  // Use FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(json)),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("Missing ADMIN_EMAIL");

  const user = await admin.auth().getUserByEmail(email);

  await admin.auth().setCustomUserClaims(user.uid, { admin: true });

  console.log(`✅ Set admin=true for ${email} (uid: ${user.uid})`);
  console.log("NOTE: User must sign out/in to refresh their token claims.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
