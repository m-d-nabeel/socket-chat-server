import express, { Router } from "express";

// local imports
import { signin, signout, signup } from "../controllers/users";

const router: Router = express.Router();

router.route("/sign-in").post(signin);
router.route("/sign-up").post(signup);
router.route("/sign-out").delete(signout);

export default router;
