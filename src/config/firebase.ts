import admin from "firebase-admin";
import path from "path";

const keyPath = path.join(__dirname, "../../serviceAccountKey.json");

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(require(keyPath)),
    });
  } catch (err) {
    console.warn("Firebase admin init failed. Make sure serviceAccountKey.json exists at project root.");
  }
}

export const verifyIdToken = async (idToken: string) => {
  if (!idToken) throw new Error("No token");
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded;
};
