import express from "express";

import { reviewController } from "../../controllers/index.js";
import {
	authenticate,
	authorizeAdmin,
	checkUserExists,
	verifyReviewOwnership,
} from "../../middlewares/index.js";
import {
	adminLimiter,
	defaultLimiter,
	strictLimiter,
} from "../../services/index.js";

const baseRouter = express.Router();
const publicRouter = express.Router();
const protectedRoutes = express.Router();
const userRouter = express.Router();
const adminRouter = express.Router();

publicRouter
	.route("/product/:productId")
	.get(defaultLimiter, reviewController.getAllByProductId);

publicRouter
	.route("/count/product/:productId")
	.get(defaultLimiter, reviewController.countByProductId);

userRouter
	.route("/")
	.post(strictLimiter, authenticate, checkUserExists, reviewController.create);

userRouter
	.route("/count/user/:userId")
	.get(
		defaultLimiter,
		authenticate,
		checkUserExists,
		reviewController.countByUserId,
	);

userRouter
	.route("/exists/user/:userId/product/:productId")
	.get(
		defaultLimiter,
		authenticate,
		checkUserExists,
		reviewController.existsByUserIdAndProductId,
	);

userRouter
	.route("/:userId")
	.get(
		defaultLimiter,
		authenticate,
		checkUserExists,
		reviewController.getAllByUserId,
	);

userRouter
	.route("/:reviewId")
	.patch(
		strictLimiter,
		authenticate,
		checkUserExists,
		verifyReviewOwnership,
		reviewController.update,
	);

userRouter
	.route("/:reviewId")
	.delete(
		defaultLimiter,
		authenticate,
		checkUserExists,
		verifyReviewOwnership,
		reviewController.delete,
	);

adminRouter
	.route("/")
	.get(
		adminLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		reviewController.getAll,
	);

adminRouter
	.route("/count")
	.get(
		adminLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		reviewController.count,
	);

adminRouter
	.route("/exists/:reviewId")
	.get(
		adminLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		reviewController.existsById,
	);

adminRouter
	.route("/:reviewId")
	.get(
		adminLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		reviewController.getById,
	);

protectedRoutes.use("/", userRouter);
protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", publicRouter);
baseRouter.use("/", protectedRoutes);

export default baseRouter;
