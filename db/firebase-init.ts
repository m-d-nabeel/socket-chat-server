import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.PATH_TO_SERVICE_ACCOUNT_JSON!)
  ),
});

export const timestamp = admin.firestore.Timestamp.now();
admin.firestore().settings({
  ignoreUndefinedProperties: true,
});
export const db = admin.firestore();
