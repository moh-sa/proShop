import express from "express";
import { userController as controller } from "../../controllers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
  RateLimiterMiddleware,
} from "../../middlewares";

const router = express.Router();

router
  .route("/profile")
  .get(
    RateLimiterMiddleware.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.getById,
  )
  .patch(
    RateLimiterMiddleware.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.update,
  );

router
  .route("/admin")
  .get(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getAll,
  );

router
  .route("/admin/:userId")
  .get(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getById,
  )
  .patch(
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
