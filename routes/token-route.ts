import express, { Router } from "express";
import { generateTokens } from "../controllers/tokens";

const tokenRouter: Router = express.Router();

tokenRouter.route("/").get(generateTokens);

export { tokenRouter };
