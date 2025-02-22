import express from "express";
import { orderController as controller } from "../../controllers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
  RateLimiterMiddleware,
} from "../../middlewares";

const router = express.Router();

// /
router
  .route("/")
  .post(
    RateLimiterMiddleware.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.create,
  )
  .get(
    RateLimiterMiddleware.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getAll,
  );

// /user/:userId
router
  .route("/user/:userId")
  .get(
    RateLimiterMiddleware.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.getUser,
  );

// /:orderId
router
  .route("/:orderId")
  .get(
    RateLimiterMiddleware.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.getById,
  );

router
  .route("/:orderId/payment")
  .patch(
    RateLimiterMiddleware.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.updateToPaid,
  );

router
  .route("/:orderId/delivery")
  .patch(
    RateLimiterMiddleware.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.updateToDelivered,
  );

export default router;
