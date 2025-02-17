import express from "express";
import { reviewController as controller } from "../../controllers";
import { RateLimiterMiddleware } from "../../middlewares";

const router = express.Router();

router
  .route("/")
  .get(RateLimiterMiddleware.adminLimiter(), controller.getAll)
  .post(RateLimiterMiddleware.strictLimiter(), controller.create);

router.get(
  "/user/:userId",
  RateLimiterMiddleware.defaultLimiter(),
  controller.getAllByUserId,
);

router.get(
  "/product/:productId",
  RateLimiterMiddleware.defaultLimiter(),
  controller.getAllByProductId,
);

router.get("/count", RateLimiterMiddleware.adminLimiter(), controller.count);

router.get(
  "/count/user/:userId",
  RateLimiterMiddleware.defaultLimiter(),
  controller.countByUserId,
);
router.get(
  "/count/product/:productId",
  RateLimiterMiddleware.defaultLimiter(),
  controller.countByProductId,
);

router.get(
  "/exists/:reviewId",
  RateLimiterMiddleware.adminLimiter(),
  controller.existsById,
);

router.get(
  "/exists/user/:userId/product/:productId",
  RateLimiterMiddleware.defaultLimiter(),
  controller.existsByUserIdAndProductId,
);

router
  .route("/:reviewId")
  .get(RateLimiterMiddleware.adminLimiter(), controller.getById)
  .put(RateLimiterMiddleware.strictLimiter(), controller.update)
  .delete(RateLimiterMiddleware.defaultLimiter(), controller.delete);

export default router;
