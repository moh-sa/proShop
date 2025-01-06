import express from "express";
import {
  authUser,
  deleteUser,
  getUserProfile,
  getUsers,
  registerUser,
  updateUser,
  updateUserProfile,
} from "../controllers/userController";
import {
  getUserByEmailMW,
  getUserByIdMW,
  isUserAdminMW,
  verifyTokenMW,
} from "../middlewares";
const router = express.Router();

router
  .route("/")
  .get(verifyTokenMW, getUserByIdMW, isUserAdminMW, getUsers)
  .post(getUserByEmailMW, registerUser);

router.route("/login").post(getUserByEmailMW, authUser);

router
  .route("/profile")
  .get(verifyTokenMW, getUserByIdMW, getUserProfile)
  .put(verifyTokenMW, getUserByIdMW, updateUserProfile);

router
  .route("/:id")
  .get(verifyTokenMW, getUserByIdMW, isUserAdminMW, getUserByIdMW)
  .put(verifyTokenMW, getUserByIdMW, isUserAdminMW, updateUser)
  .delete(verifyTokenMW, getUserByIdMW, isUserAdminMW, deleteUser);

export default router;
