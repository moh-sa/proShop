import express from "express";
import { AuthController } from "../../controllers";
import { RateLimiterMiddleware } from "../../middlewares";
const router = express.Router();

const controller = new AuthController();

router
  .route("/signup")
  .post(RateLimiterMiddleware.authLimiter(), controller.signup);

router
  .route("/signin")
  .post(RateLimiterMiddleware.authLimiter(), controller.signin);

export default router;
