import express from "express";
import { reviewController as controller } from "../../controllers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
  RateLimiterMiddleware,
  verifyReviewOwnership,
} from "../../middlewares";

const baseRouter = express.Router();
const publicRouter = express.Router();
const protectedRoutes = express.Router();
const userRouter = express.Router();
const adminRouter = express.Router();

publicRouter
  .route("/product/:productId")
  .get(RateLimiterMiddleware.defaultLimiter(), controller.getAllByProductId);

publicRouter
  .route("/count/product/:productId")
  .get(RateLimiterMiddleware.defaultLimiter(), controller.countByProductId);

userRouter
  .route("/")
  .post(
    RateLimiterMiddleware.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.create,
  );

userRouter
  .route("/count/user/:userId")
  .get(
    RateLimiterMiddleware.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.countByUserId,
  );

userRouter
  .route("/exists/user/:userId/product/:productId")
  .get(
    RateLimiterMiddleware.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.existsByUserIdAndProductId,
  );

userRouter
  .route("/:userId")
  .get(
    RateLimiterMiddleware.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.getAllByUserId,
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

adminRouter
  .route("/")
  .get(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getAll,
  );

adminRouter
  .route("/count")
  .get(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.count,
  );

adminRouter
  .route("/exists/:reviewId")
  .get(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.existsById,
  );

adminRouter
  .route("/:reviewId")
  .get(
    RateLimiterMiddleware.adminLimiter(),
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
