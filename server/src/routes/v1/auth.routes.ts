import express from "express";

import { AuthController } from "../../controllers/index.js";
import { authLimiter } from "../../managers/index.js";
const router = express.Router();

const controller = new AuthController();

router.route("/signup").post(authLimiter, controller.signup);

router.route("/signin").post(authLimiter, controller.signin);

export default router;
