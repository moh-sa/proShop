import express from "express";

import { userController } from "../../controllers/index.js";
import {
	authenticate,
	authorizeAdmin,
	checkUserExists,
} from "../../middlewares/index.js";
import {
	adminLimiter,
	defaultLimiter,
	strictLimiter,
} from "../../services/index.js";

const baseRouter = express.Router();

const protectedRoutes = express.Router();
const profileRouter = express.Router();
const adminRouter = express.Router();

profileRouter
	.route("/")
	.get(defaultLimiter, authenticate, checkUserExists, userController.getById);

profileRouter
	.route("/")
	.patch(strictLimiter, authenticate, checkUserExists, userController.update);

adminRouter
	.route("/")
	.get(
		adminLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		userController.getAll,
	);

adminRouter
	.route("/:userId")
	.get(
		adminLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		userController.getById,
	);

adminRouter
	.route("/:userId")
	.patch(
		adminLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		userController.update,
	);

adminRouter
	.route("/:userId")
	.delete(
		adminLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		userController.delete,
	);

protectedRoutes.use("/admin", adminRouter);
protectedRoutes.use("/profile", profileRouter);

baseRouter.use("/", protectedRoutes);

export default baseRouter;
