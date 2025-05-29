import express from "express";
import { AuthController } from "../../controllers";
import { RateLimiterManager } from "../../managers";
const router = express.Router();

const controller = new AuthController();

router
  .route("/signup")
  .post(RateLimiterManager.authLimiter(), controller.signup);

router
  .route("/signin")
  .post(RateLimiterManager.authLimiter(), controller.signin);

export default router;
