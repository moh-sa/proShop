import express from "express";

import { OrderController } from "../../controllers/index.js";
import {
	authenticate,
	checkIfUserIsAdmin,
	checkUserIdExists,
} from "../../middlewares/index.js";
import { defaultLimiter, strictLimiter } from "../../services/index.js";

const controller = new OrderController();

const baseRouter = express.Router();
const protectedRoutes = express.Router();
const userRouter = express.Router();
const adminRouter = express.Router();

userRouter
	.route("/")
	.post(strictLimiter, authenticate, checkUserIdExists, controller.create);

userRouter
	.route("/user/:userId")
	.get(
		defaultLimiter,
		authenticate,
		checkUserIdExists,
		controller.getAllByUserId,
	);

userRouter
	.route("/:orderId")
	.get(defaultLimiter, authenticate, checkUserIdExists, controller.getById);

adminRouter
	.route("/")
	.get(
		defaultLimiter,
		authenticate,
		checkUserIdExists,
		checkIfUserIsAdmin,
		controller.getAll,
	);

adminRouter
	.route("/:orderId/payment")
	.patch(
		strictLimiter,
		authenticate,
		checkUserIdExists,
		checkIfUserIsAdmin,
		controller.updateToPaid,
	);

adminRouter
	.route("/:orderId/delivery")
	.patch(
		strictLimiter,
		authenticate,
		checkUserIdExists,
		checkIfUserIsAdmin,
		controller.updateToDelivered,
	);

protectedRoutes.use("/", userRouter);
protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", protectedRoutes);

export default baseRouter;
