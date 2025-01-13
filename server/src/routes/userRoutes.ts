import express from "express";
import { userController as controller } from "../controllers";
import {
  checkEmailExists,
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkPasswordValidation,
  checkUserIdExists,
} from "../middlewares";
const router = express.Router();

router
  .route("/")
  .get(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getAll,
  )
  .post(checkEmailExists, controller.signup);

router
  .route("/login")
  .post(checkEmailExists(true), checkPasswordValidation, controller.signin);

router
  .route("/profile")
  .get(checkJwtTokenValidation, checkUserIdExists, controller.getById)
  .put(checkJwtTokenValidation, checkUserIdExists, controller.update);

router
  .route("/:id")
  .get(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.getById,
  )
  .put(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.update,
  )
  .delete(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.delete,
  );

export default router;
