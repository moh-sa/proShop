import express from "express";

import { orderController } from "../../controllers/index.js";
import {
	authenticate,
	authorizeAdmin,
	checkUserExists,
} from "../../middlewares/index.js";
import { defaultLimiter, strictLimiter } from "../../services/index.js";

const baseRouter = express.Router();
const protectedRoutes = express.Router();
const userRouter = express.Router();
const adminRouter = express.Router();

userRouter
	.route("/")
	.post(strictLimiter, authenticate, checkUserExists, orderController.create);

userRouter
	.route("/user/:userId")
	.get(
		defaultLimiter,
		authenticate,
		checkUserExists,
		orderController.getAllByUserId,
	);

userRouter
	.route("/:orderId")
	.get(defaultLimiter, authenticate, checkUserExists, orderController.getById);

adminRouter
	.route("/")
	.get(
		defaultLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		orderController.getAll,
	);

adminRouter
	.route("/:orderId/payment")
	.patch(
		strictLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		orderController.updatePayment,
	);

protectedRoutes.use("/", userRouter);
protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", protectedRoutes);

export default baseRouter;
