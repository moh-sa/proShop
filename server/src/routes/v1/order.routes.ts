import express from "express";
import { OrderController } from "../../controllers";
import { defaultLimiter, strictLimiter } from "../../managers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
} from "../../middlewares";

const controller = new OrderController();

const baseRouter = express.Router();
const protectedRoutes = express.Router();
const userRouter = express.Router();
const adminRouter = express.Router();

userRouter
  .route("/")
  .post(
    strictLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.create,
  );

userRouter
  .route("/user/:userId")
  .get(
    defaultLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.getAllByUserId,
  );

userRouter
  .route("/:orderId")
  .get(
    defaultLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.getById,
  );

adminRouter
  .route("/")
  .get(
    defaultLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getAll,
  );

adminRouter
  .route("/:orderId/payment")
  .patch(
    strictLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.updateToPaid,
  );

adminRouter
  .route("/:orderId/delivery")
  .patch(
    strictLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.updateToDelivered,
  );

protectedRoutes.use("/", userRouter);
protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", protectedRoutes);

export default baseRouter;
