import { SignUpData } from "../custom-types";
import { hashRefreshToken } from "../utils/bcrypt";
import { db, timestamp } from "./firebase-init";

const userDocRef = db.collection("users");
const refreshTokenCollection = db.collection("refreshTokens");

export const getUserByEmail = async (email: string) => {
  const userSnapshot = await userDocRef.doc(email).get();
  return userSnapshot.exists ? userSnapshot.data() : null;
};

export const createUser = async (userData: SignUpData) => {
  try {
    const userFirestoreData = {
      displayName: userData.firstName + " " + userData.lastName,
      email: userData.email,
      password: userData.password,
    };
    await userDocRef.doc(userData.email).set(userFirestoreData);
    const user = await getUserByEmail(userData.email);
    console.log("User created");
    return Promise.resolve({
      displayName: user?.displayName,
      email: user?.email,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const setRefreshToken = async (email: string, refreshToken: string) => {
  try {
    const hashedToken = await hashRefreshToken(refreshToken);
    await refreshTokenCollection.doc(email).set({
      token: hashedToken,
      createdTimestamp: timestamp,
    });
  } catch (error) {
    console.log("[SET-REFRESH-TOKEN]", error);
    throw error;
  }
};

export const removeRefreshToken = async (email: string) => {
  try {
    const docSnapshot = await refreshTokenCollection.doc(email).get();
    if (!docSnapshot.exists) {
      return Promise.reject("Refresh token not found");
    }

    await docSnapshot.ref.delete();
    console.log("Refresh token removed");
  } catch (error) {
    console.error(`Error removing refresh token for user ${email}:`, error);
    throw error;
  }
};

export const getRefreshToken = async (email: string) => {
  try {
    const refreshTokenDoc = await refreshTokenCollection.doc(email).get();
    return refreshTokenDoc.exists ? refreshTokenDoc.data()?.token : null;
  } catch (error) {
    console.error(error);
  }
};
