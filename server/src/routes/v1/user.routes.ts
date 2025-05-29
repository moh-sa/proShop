import express from "express";
import { UserController } from "../../controllers";
import { adminLimiter, defaultLimiter, strictLimiter } from "../../managers";
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
    defaultLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.getById,
  )
  .patch(
    strictLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.update,
  );

adminRouter
  .route("/")
  .get(
    adminLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getAll,
  );

adminRouter
  .route("/:userId")
  .get(
    adminLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getById,
  )
  .patch(
    adminLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.update,
  )
  .delete(
    adminLimiter,
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.delete,
  );

protectedRoutes.use("/admin", adminRouter);
protectedRoutes.use("/profile", profileRouter);

baseRouter.use("/", protectedRoutes);

export default baseRouter;
