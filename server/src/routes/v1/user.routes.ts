import express from "express";

import { UserController } from "../../controllers/index.js";
import {
	authenticate,
	checkIfUserIsAdmin,
	checkUserExists,
} from "../../middlewares/index.js";
import {
	adminLimiter,
	defaultLimiter,
	strictLimiter,
} from "../../services/index.js";

const controller = new UserController();

const baseRouter = express.Router();

const protectedRoutes = express.Router();
const profileRouter = express.Router();
const adminRouter = express.Router();

profileRouter
	.route("/")
	.get(defaultLimiter, authenticate, checkUserExists, controller.getById)
	.patch(strictLimiter, authenticate, checkUserExists, controller.update);

adminRouter
	.route("/")
	.get(
		adminLimiter,
		authenticate,
		checkUserExists,
		checkIfUserIsAdmin,
		controller.getAll,
	);

adminRouter
	.route("/:userId")
	.get(
		adminLimiter,
		authenticate,
		checkUserExists,
		checkIfUserIsAdmin,
		controller.getById,
	)
	.patch(
		adminLimiter,
		authenticate,
		checkUserExists,
		checkIfUserIsAdmin,
		controller.update,
	)
	.delete(
		adminLimiter,
		authenticate,
		checkUserExists,
		checkIfUserIsAdmin,
		controller.delete,
	);

protectedRoutes.use("/admin", adminRouter);
protectedRoutes.use("/profile", profileRouter);

baseRouter.use("/", protectedRoutes);

export default baseRouter;
