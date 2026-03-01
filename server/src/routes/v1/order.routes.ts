import express from "express";

import { orderController } from "../../controllers/index.js";
import { adminGuard, userGuard } from "../../middlewares/index.js";
import { defaultLimiter, strictLimiter } from "../../services/index.js";

const baseRouter = express.Router();
const protectedRoutes = express.Router();
const userRouter = express.Router();
const adminRouter = express.Router();

userRouter
	.route("/")
	.post(...userGuard(strictLimiter), orderController.create);

userRouter
	.route("/user/:userId")
	.get(...userGuard(defaultLimiter), orderController.getAllByUserId);

userRouter
	.route("/:orderId")
	.get(...userGuard(defaultLimiter), orderController.getById);

adminRouter
	.route("/")
	.get(...adminGuard(defaultLimiter), orderController.getAll);

adminRouter
	.route("/:orderId/payment")
	.patch(...adminGuard(strictLimiter), orderController.updatePayment);

protectedRoutes.use("/", userRouter);
protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", protectedRoutes);

export default baseRouter;
