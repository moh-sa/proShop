import express from "express";
import { ReviewController } from "../../controllers";
import { RateLimiterManager } from "../../managers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
  verifyReviewOwnership,
} from "../../middlewares";
const controller = new ReviewController();

const baseRouter = express.Router();
const publicRouter = express.Router();
const protectedRoutes = express.Router();
const userRouter = express.Router();
const adminRouter = express.Router();

publicRouter
  .route("/product/:productId")
  .get(RateLimiterManager.defaultLimiter(), controller.getAllByProductId);

publicRouter
  .route("/count/product/:productId")
  .get(RateLimiterManager.defaultLimiter(), controller.countByProductId);

userRouter
  .route("/")
  .post(
    RateLimiterManager.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.create,
  );

userRouter
  .route("/count/user/:userId")
  .get(
    RateLimiterManager.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.countByUserId,
  );

userRouter
  .route("/exists/user/:userId/product/:productId")
  .get(
    RateLimiterManager.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.existsByUserIdAndProductId,
  );

userRouter
  .route("/:userId")
  .get(
    RateLimiterManager.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.getAllByUserId,
  )
  .patch(
    RateLimiterManager.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    verifyReviewOwnership,
    controller.update,
  )
  .delete(
    RateLimiterManager.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    verifyReviewOwnership,
    controller.delete,
  );

adminRouter
  .route("/")
  .get(
    RateLimiterManager.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getAll,
  );

adminRouter
  .route("/count")
  .get(
    RateLimiterManager.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.count,
  );

adminRouter
  .route("/exists/:reviewId")
  .get(
    RateLimiterManager.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.existsById,
  );

adminRouter
  .route("/:reviewId")
  .get(
    RateLimiterManager.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getById,
  );

protectedRoutes.use("/", userRouter);
protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", publicRouter);
baseRouter.use("/", protectedRoutes);

export default baseRouter;
