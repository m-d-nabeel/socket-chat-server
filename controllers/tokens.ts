// tokenController.ts
import { Request, Response } from "express";
import { generateAccessToken, verifyRefreshToken } from "../utils/token-utils";

export const generateTokens = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    const decodedRefreshToken = await verifyRefreshToken(refreshToken);
    if (!decodedRefreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const payload = {
      displayName: decodedRefreshToken.displayName,
      email: decodedRefreshToken.email,
    };

    const newAccessToken = generateAccessToken(payload);

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Error generating tokens:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
