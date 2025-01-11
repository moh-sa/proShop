import express from "express";

import {
  authUser,
  deleteUser,
  getUserById,
  getUserProfile,
  getUsers,
  registerUser,
  updateUser,
  updateUserProfile,
} from "../controllers/userController";
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
  .get(checkJwtTokenValidation, checkUserIdExists, checkIfUserIsAdmin, getUsers)
  .post(checkEmailExists, registerUser);

router
  .route("/login")
  .post(checkEmailExists(true), checkPasswordValidation, authUser);

router
  .route("/profile")
  .get(checkJwtTokenValidation, checkUserIdExists, getUserProfile)
  .put(checkJwtTokenValidation, checkUserIdExists, updateUserProfile);

router
  .route("/:id")
  .get(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    getUserById,
  )
  .put(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    updateUser,
  )
  .delete(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    deleteUser,
  );

export default router;
