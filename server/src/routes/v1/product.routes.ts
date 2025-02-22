import express from "express";
import { productController as controller } from "../../controllers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
  RateLimiterMiddleware,
} from "../../middlewares";

const router = express.Router();

router
  .route("/")
  .get(RateLimiterMiddleware.defaultLimiter(), controller.getAll);

router
  .route("/top-rated")
  .get(RateLimiterMiddleware.defaultLimiter(), controller.getTopRated);

router
  .route("/admin")
  .post(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.create,
  );

router
  .route("/admin/:productId")
  .get(RateLimiterMiddleware.defaultLimiter(), controller.getById)
  .delete(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.delete,
  )
  .patch(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.update,
  );

export default router;
