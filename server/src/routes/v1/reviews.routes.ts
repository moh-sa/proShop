import express from "express";

import { ReviewController } from "../../controllers/index.js";
import {
	authenticate,
	checkIfUserIsAdmin,
	checkUserExists,
	verifyReviewOwnership,
} from "../../middlewares/index.js";
import {
	adminLimiter,
	defaultLimiter,
	strictLimiter,
} from "../../services/index.js";
const controller = new ReviewController();

const baseRouter = express.Router();
const publicRouter = express.Router();
const protectedRoutes = express.Router();
const userRouter = express.Router();
const adminRouter = express.Router();

publicRouter
	.route("/product/:productId")
	.get(defaultLimiter, controller.getAllByProductId);

publicRouter
	.route("/count/product/:productId")
	.get(defaultLimiter, controller.countByProductId);

userRouter
	.route("/")
	.post(strictLimiter, authenticate, checkUserExists, controller.create);

userRouter
	.route("/count/user/:userId")
	.get(defaultLimiter, authenticate, checkUserExists, controller.countByUserId);

userRouter
	.route("/exists/user/:userId/product/:productId")
	.get(
		defaultLimiter,
		authenticate,
		checkUserExists,
		controller.existsByUserIdAndProductId,
	);

userRouter
	.route("/:userId")
	.get(defaultLimiter, authenticate, checkUserExists, controller.getAllByUserId)
	.patch(
		strictLimiter,
		authenticate,
		checkUserExists,
		verifyReviewOwnership,
		controller.update,
	)
	.delete(
		defaultLimiter,
		authenticate,
		checkUserExists,
		verifyReviewOwnership,
		controller.delete,
	);

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
	.route("/count")
	.get(
		adminLimiter,
		authenticate,
		checkUserExists,
		checkIfUserIsAdmin,
		controller.count,
	);

adminRouter
	.route("/exists/:reviewId")
	.get(
		adminLimiter,
		authenticate,
		checkUserExists,
		checkIfUserIsAdmin,
		controller.existsById,
	);

adminRouter
	.route("/:reviewId")
	.get(
		adminLimiter,
		authenticate,
		checkUserExists,
		checkIfUserIsAdmin,
		controller.getById,
	);

protectedRoutes.use("/", userRouter);
protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", publicRouter);
baseRouter.use("/", protectedRoutes);

export default baseRouter;
