import express from "express";
import { productController as controller } from "../../controllers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkProductReviewedByUser,
  checkUserIdExists,
  RateLimiterMiddleware,
} from "../../middlewares";

const router = express.Router();

// /
router
  .route("/")
  .get(RateLimiterMiddleware.defaultLimiter(), controller.getAll)
  .post(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.create,
  );

// /top-rated
router
  .route("/top-rated")
  .get(RateLimiterMiddleware.defaultLimiter(), controller.getTopRated);

// /:productId
router
  .route("/:productId")
  .get(RateLimiterMiddleware.defaultLimiter(), controller.getById)
  .delete(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.delete,
  )
  .put(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.update,
  );

// /:productId/reviews
router
  .route("/:productId/reviews")
  .post(
    RateLimiterMiddleware.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkProductReviewedByUser,
    controller.createReview,
  );

export default router;
