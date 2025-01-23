import express from "express";
import { productController as controller } from "../controllers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkProductReviewedByUser,
  checkUserIdExists,
  RateLimiterMiddleware,
} from "../middlewares";
const router = express.Router();

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

router
  .route("/top")
  .get(RateLimiterMiddleware.defaultLimiter(), controller.getTopRated);

router
  .route("/:id")
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

router
  .route("/:id/reviews")
  .post(
    RateLimiterMiddleware.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkProductReviewedByUser,
    controller.createReview,
  );

export default router;
