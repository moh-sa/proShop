import express from "express";
import { UserController } from "../../controllers";
import { RateLimiterManager } from "../../managers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
} from "../../middlewares";

const controller = new UserController();

const baseRouter = express.Router();

const protectedRoutes = express.Router();
const profileRouter = express.Router();
const adminRouter = express.Router();

profileRouter
  .route("/")
  .get(
    RateLimiterManager.defaultLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.getById,
  )
  .patch(
    RateLimiterManager.strictLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.update,
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
  .route("/:userId")
  .get(
    RateLimiterManager.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getById,
  )
  .patch(
    RateLimiterManager.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.update,
  )
  .delete(
    RateLimiterManager.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.delete,
  );

protectedRoutes.use("/admin", adminRouter);
protectedRoutes.use("/profile", profileRouter);

baseRouter.use("/", protectedRoutes);

export default baseRouter;
