import { Request, Response } from "express";
import bcrypt from "bcrypt";

// local imports
import { FormData, LoginData } from "../custom-types";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token-utils";
import {
  createUser,
  getUserByEmail,
  removeRefreshToken,
  setRefreshToken,
} from "../db/user-db";

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginData = req.body;
    if (!email || !password) {
      return res
        .status(401)
        .json({ message: "Email and Password are required." });
    }

    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      console.log("User does not exist.");
      return res.status(401).json({ message: "User does not exist." });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Invalid Credentials" });

    const toTokenData = {
      displayName: existingUser.displayName,
      email: existingUser.email,
    };

    const accessToken = generateAccessToken(toTokenData);
    const refreshToken = generateRefreshToken(toTokenData);
    setRefreshToken(email, refreshToken);
    console.log("Access token generated");
    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.log("[SIGNIN]: " + error);
    return res.status(500).send("[SIGN_IN]" + error);
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, confirmPassword }: FormData =
      req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(401).json({ message: "All fields are required" });
    }
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log("User already exists");
      return res.status(401).json({ message: "User does not exist." });
    }
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords doesn't match" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const data = { firstName, lastName, email, password: hashedPassword };

    const toTokenData = await createUser(data);
    if (!toTokenData) {
      return res.status(401).json({ message: "Email already exists." });
    }
    const accessToken = generateAccessToken(toTokenData);
    const refreshToken = generateRefreshToken(toTokenData);
    setRefreshToken(email, refreshToken);
    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.log("[SIGNUP]: " + error);
    return res.status(500).send("[SIGNUP]" + error);
  }
};

export const signout = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await removeRefreshToken(email);
    return res.status(200).json({ message: "Refresh token has been removed" });
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
};
