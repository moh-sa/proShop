import express from "express";
import { authController as controller } from "../../controllers";
import { RateLimiterMiddleware } from "../../middlewares";
const router = express.Router();

router
  .route("/signup")
  .post(RateLimiterMiddleware.authLimiter(), controller.signup);

router
  .route("/signin")
  .post(RateLimiterMiddleware.authLimiter(), controller.signin);

export default router;
