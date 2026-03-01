import express from "express";

import { userController } from "../../controllers/index.js";
import { adminGuard, userGuard } from "../../middlewares/index.js";
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
	.get(...userGuard(defaultLimiter), userController.getById);

profileRouter
	.route("/")
	.patch(...userGuard(strictLimiter), userController.update);

adminRouter
	.route("/")
	.get(...adminGuard(adminLimiter), userController.getAll);

adminRouter
	.route("/:userId")
	.get(...adminGuard(adminLimiter), userController.getById);

adminRouter
	.route("/:userId")
	.patch(...adminGuard(adminLimiter), userController.update);

adminRouter
	.route("/:userId")
	.delete(...adminGuard(adminLimiter), userController.delete);

protectedRoutes.use("/admin", adminRouter);
protectedRoutes.use("/profile", profileRouter);

baseRouter.use("/", protectedRoutes);

export default baseRouter;
