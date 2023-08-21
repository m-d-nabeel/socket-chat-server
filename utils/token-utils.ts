import jwt, { JwtPayload } from "jsonwebtoken";
import { JwtDecodedUser, PublicUserData } from "../custom-types";
import bcrypt from "bcrypt";
import { getRefreshToken } from "../db/user-db";

export const generateAccessToken = (userData: PublicUserData) => {
  const accessToken = jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "30m",
  });
  return accessToken;
};

export const generateRefreshToken = (userData: PublicUserData) => {
  const refreshToken = jwt.sign(userData, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });
  return refreshToken;
};

export const verifyAccessToken = (token: string) => {
  return new Promise<JwtPayload | null>((resolve) => {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, decoded) => {
      if (err) {
        resolve(null);
      } else {
        resolve(decoded as JwtPayload);
      }
    });
  });
};

export const verifyRefreshToken = async (token: string) => {
  try {
    let decodedData: JwtDecodedUser | undefined;
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!, (err, decoded) => {
      if (err) throw Error("Error verifying");
      decodedData = decoded as JwtDecodedUser;
    });
    const dbRefreshToken = await getRefreshToken(decodedData?.email as string);
    if (!dbRefreshToken) throw Error("Invalid refresh token");
    const isVerified = await bcrypt.compare(token, dbRefreshToken);
    if (!isVerified) throw Error("Invalid refresh token");
    return decodedData;
  } catch (error) {
    console.error("[VERIFY_REFRESH_TOKEN]", error);
  }
};
