import express from "express";

import { UserController } from "../../controllers/index.js";
import {
	checkIfUserIsAdmin,
	checkUserIdExists,
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
	.get(defaultLimiter, checkUserIdExists, controller.getById)
	.patch(strictLimiter, checkUserIdExists, controller.update);

adminRouter
	.route("/")
	.get(adminLimiter, checkUserIdExists, checkIfUserIsAdmin, controller.getAll);

adminRouter
	.route("/:userId")
	.get(adminLimiter, checkUserIdExists, checkIfUserIsAdmin, controller.getById)
	.patch(adminLimiter, checkUserIdExists, checkIfUserIsAdmin, controller.update)
	.delete(
		adminLimiter,
		checkUserIdExists,
		checkIfUserIsAdmin,
		controller.delete,
	);

protectedRoutes.use("/admin", adminRouter);
protectedRoutes.use("/profile", profileRouter);

baseRouter.use("/", protectedRoutes);

export default baseRouter;
