import admin from "firebase-admin";
import path from "path";
import { ADMIN_EMAILS } from "../config/admin";

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
  const user = {
    uid: decoded.uid,
    displayName: decoded.displayName,
    email: decoded.email,
    isAdmin: ADMIN_EMAILS.includes(decoded.email as string), // set the isAdmin property based on the email
  };
  return user;
};
