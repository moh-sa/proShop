import express from "express";
import { authController as controller } from "../../controllers";
import {
  checkPasswordValidation,
  RateLimiterMiddleware,
} from "../../middlewares";
const router = express.Router();

router
  .route("/signup")
  .post(RateLimiterMiddleware.authLimiter(), controller.signup);

router
  .route("/signin")
  .post(
    RateLimiterMiddleware.authLimiter(),
    checkPasswordValidation,
    controller.signin,
  );

export default router;
