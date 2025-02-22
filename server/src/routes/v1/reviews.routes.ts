import express from "express";
import { reviewController as controller } from "../../controllers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
  RateLimiterMiddleware,
  verifyReviewOwnership,
} from "../../middlewares";

const router = express.Router();

router
  .route("/")
  .post(
    RateLimiterMiddleware.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.create,
  );

router.get(
  "/user/:userId",
  RateLimiterMiddleware.defaultLimiter(),
  checkJwtTokenValidation,
  checkUserIdExists,
  controller.getAllByUserId,
);

router.get(
  "/product/:productId",
  RateLimiterMiddleware.defaultLimiter(),
  controller.getAllByProductId,
);

router.get(
  "/count/user/:userId",
  RateLimiterMiddleware.defaultLimiter(),
  checkJwtTokenValidation,
  checkUserIdExists,
  controller.countByUserId,
);
router.get(
  "/count/product/:productId",
  RateLimiterMiddleware.defaultLimiter(),
  controller.countByProductId,
);

router.get(
  "/exists/user/:userId/product/:productId",
  RateLimiterMiddleware.defaultLimiter(),
  checkJwtTokenValidation,
  checkUserIdExists,
  controller.existsByUserIdAndProductId,
);

router.get(
  "/admin",
  RateLimiterMiddleware.adminLimiter(),
  checkJwtTokenValidation,
  checkUserIdExists,
  checkIfUserIsAdmin,
  controller.getAll,
);

router.get(
  "/admin/count",
  RateLimiterMiddleware.adminLimiter(),
  checkJwtTokenValidation,
  checkUserIdExists,
  checkIfUserIsAdmin,
  controller.count,
);

router.get(
  "/admin/exists/:reviewId",
  RateLimiterMiddleware.adminLimiter(),
  checkJwtTokenValidation,
  checkUserIdExists,
  checkIfUserIsAdmin,
  controller.existsById,
);

router
  .route("admin/:reviewId")
  .get(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getById,
  )
  .patch(
    RateLimiterMiddleware.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    verifyReviewOwnership,
    controller.update,
  )
  .delete(
    RateLimiterMiddleware.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    verifyReviewOwnership,
    controller.delete,
  );

export default router;
