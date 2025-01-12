import express from "express";
import { userController } from "../controllers";
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
    userController.getAll,
  )
  .post(checkEmailExists, userController.signup);

router
  .route("/login")
  .post(checkEmailExists(true), checkPasswordValidation, userController.signin);

router
  .route("/profile")
  .get(checkJwtTokenValidation, checkUserIdExists, userController.getById)
  .put(checkJwtTokenValidation, checkUserIdExists, userController.update);

router
  .route("/:id")
  .get(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    userController.getById,
  )
  .put(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    userController.update,
  )
  .delete(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    userController.delete,
  );

export default router;
