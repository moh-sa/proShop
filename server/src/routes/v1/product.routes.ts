import express from "express";
import { uploadSingle as uploadSingleMiddleware } from "../../config/multer.config";
import { productController as controller } from "../../controllers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
  RateLimiterMiddleware,
} from "../../middlewares";

const baseRouter = express.Router();

const publicRouter = express.Router();

const protectedRoutes = express.Router();
const adminRouter = express.Router();

publicRouter
  .route("/")
  .get(RateLimiterMiddleware.defaultLimiter(), controller.getAll);

publicRouter
  .route("/top-rated")
  .get(RateLimiterMiddleware.defaultLimiter(), controller.getTopRated);

adminRouter
  .route("/")
  .post(
    RateLimiterMiddleware.adminLimiter(),
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    uploadSingleMiddleware,
    controller.create,
  );

adminRouter
  .route("/:productId")
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
    uploadSingleMiddleware,
    controller.update,
  );

protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", publicRouter);
baseRouter.use("/", protectedRoutes);

export default baseRouter;
