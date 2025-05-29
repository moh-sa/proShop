import express from "express";
import { uploadSingle as uploadSingleMiddleware } from "../../config/multer.config";
import { ProductController } from "../../controllers";
import { RateLimiterManager } from "../../managers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
} from "../../middlewares";

const controller = new ProductController();

const baseRouter = express.Router();

const publicRouter = express.Router();

const protectedRoutes = express.Router();
const adminRouter = express.Router();

publicRouter
  .route("/")
  .get(RateLimiterManager.defaultLimiter(), controller.getAll);

publicRouter
  .route("/top-rated")
  .get(RateLimiterManager.defaultLimiter(), controller.getTopRated);

adminRouter
  .route("/")
  .post(
    RateLimiterManager.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    uploadSingleMiddleware,
    controller.create,
  );

adminRouter
  .route("/:productId")
  .get(RateLimiterManager.defaultLimiter(), controller.getById)
  .delete(
    RateLimiterManager.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.delete,
  )
  .patch(
    RateLimiterManager.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    uploadSingleMiddleware,
    controller.update,
  );

protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", publicRouter);
baseRouter.use("/", protectedRoutes);

export default baseRouter;
