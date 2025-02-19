import express from "express";
import { authController as controller } from "../../controllers";
import {
  checkEmailExists,
  checkPasswordValidation,
  RateLimiterMiddleware,
} from "../../middlewares";

const router = express.Router();

router
  .route("/signup")
  .post(
    RateLimiterMiddleware.authLimiter(),
    checkEmailExists(),
    controller.signup,
  );

router
  .route("/signin")
  .post(
    RateLimiterMiddleware.authLimiter(),
    checkEmailExists(true),
    checkPasswordValidation,
    controller.signin,
  );

export default router;
