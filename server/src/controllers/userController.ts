import asyncHandler from "express-async-handler";
import User, { IUser } from "../models/userModel";
import { generateToken, handleErrorResponse, isExist } from "../utils";

/**
 * @desc Auth user & get token
 * @route POST /api/users/login
 * @access Public
 */
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken({ id: user._id }),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password.");
  }
});

/**
 * @desc Register a new user
 * @route POST /api/users
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExist = await User.findOne({ email });
  if (userExist) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, email, password });
  if (user) {
    res.status(201);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken({ id: user._id }),
    });
  } else {
    res.status(400);
    throw new Error("invalid user data");
  }
});

/**
 * @desc Get user profile
 * @route GET /api/users/profile
 * @access private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const customReq = req as typeof req & { user: IUser };
  const user = await User.findById(customReq.user._id);
  if (!isExist(user)) return handleErrorResponse(res, 404, "User not found");

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  });
});

/**
 * @desc update user profile
 * @route PUT /api/users/profile
 * @access private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const customReq = req as typeof req & { user: IUser };
  const user = await User.findById(customReq.user._id);
  if (!isExist(user)) return handleErrorResponse(res, 404, "User not found");

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;

  if (req.body.password) {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
    token: generateToken({ id: user._id }),
  });
});

/**
 * @desc Get all users
 * @route GET /api/users
 * @access private/admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

/**
 * @desc Delete a user
 * @route DELETE /api/users/:id
 * @access private/admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!isExist(user)) return handleErrorResponse(res, 404, "User not found");

  await user.remove();
  res.json({ message: "User removed" });
});

/**
 * @desc Get user by id
 * @route GET /api/users/:id
 * @access private/admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!isExist(user)) return handleErrorResponse(res, 404, "User not found");

  res.json(user);
});

/**
 * @desc update user
 * @route PUT /api/users/:id
 * @access private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!isExist(user)) return handleErrorResponse(res, 404, "User not found");

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.isAdmin = req.body.isAdmin ?? user.isAdmin;

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
  });
});

export {
  authUser,
  deleteUser,
  getUserById,
  getUserProfile,
  getUsers,
  registerUser,
  updateUser,
  updateUserProfile,
};
