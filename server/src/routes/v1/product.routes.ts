import express from "express";
import { uploadSingle as uploadSingleMiddleware } from "../../config/multer.config";
import { ProductController } from "../../controllers";
import { adminLimiter, defaultLimiter } from "../../managers";
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

publicRouter.route("/").get(defaultLimiter, controller.getAll);

publicRouter.route("/top-rated").get(defaultLimiter, controller.getTopRated);

adminRouter
  .route("/")
  .post(
    adminLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    uploadSingleMiddleware,
    controller.create,
  );

adminRouter
  .route("/:productId")
  .get(defaultLimiter, controller.getById)
  .delete(
    adminLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.delete,
  )
  .patch(
    adminLimiter,
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
