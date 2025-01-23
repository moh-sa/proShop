import express from "express";
import { userController as controller } from "../../controllers";
import {
  checkEmailExists,
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkPasswordValidation,
  checkUserIdExists,
  RateLimiterMiddleware,
} from "../../middlewares";

const router = express.Router();

router
  .route("/")
  .get(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getAll,
  )
  .post(
    RateLimiterMiddleware.authLimiter(),
    checkEmailExists(),
    controller.signup,
  );

router
  .route("/login")
  .post(
    RateLimiterMiddleware.authLimiter(),
    checkEmailExists(true),
    checkPasswordValidation,
    controller.signin,
  );

router
  .route("/profile")
  .get(
    RateLimiterMiddleware.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.getById,
  )
  .put(
    RateLimiterMiddleware.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.update,
  );

router
  .route("/:userId")
  .get(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getById,
  )
  .put(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.update,
  )
  .delete(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.delete,
  );

export default router;
