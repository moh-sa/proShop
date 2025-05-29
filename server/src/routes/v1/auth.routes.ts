import express from "express";
import { AuthController } from "../../controllers";
import { authLimiter } from "../../managers";
const router = express.Router();

const controller = new AuthController();

router.route("/signup").post(authLimiter, controller.signup);

router.route("/signin").post(authLimiter, controller.signin);

export default router;
