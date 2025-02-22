import express from "express";
import { userController as controller } from "../../controllers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
  RateLimiterMiddleware,
} from "../../middlewares";

const baseRouter = express.Router();

const protectedRoutes = express.Router();
const profileRouter = express.Router();
const adminRouter = express.Router();

profileRouter
  .route("/")
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
  .route("/:userId")
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

protectedRoutes.use("/admin", adminRouter);
protectedRoutes.use("/profile", profileRouter);

baseRouter.use("/", protectedRoutes);

export default baseRouter;
