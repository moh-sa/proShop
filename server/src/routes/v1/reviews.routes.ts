import express from "express";

import { reviewController } from "../../controllers/index.js";
import {
	adminGuard,
	userGuard,
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
	.post(...userGuard(strictLimiter), reviewController.create);

userRouter
	.route("/count/user/:userId")
	.get(...userGuard(defaultLimiter), reviewController.countByUserId);

userRouter
	.route("/exists/user/:userId/product/:productId")
	.get(...userGuard(defaultLimiter), reviewController.existsByUserIdAndProductId);

userRouter
	.route("/:userId")
	.get(...userGuard(defaultLimiter), reviewController.getAllByUserId);

userRouter
	.route("/:reviewId")
	.patch(
		...userGuard(strictLimiter),
		verifyReviewOwnership,
		reviewController.update,
	);

userRouter
	.route("/:reviewId")
	.delete(
		...userGuard(defaultLimiter),
		verifyReviewOwnership,
		reviewController.delete,
	);

adminRouter
	.route("/")
	.get(...adminGuard(adminLimiter), reviewController.getAll);

adminRouter
	.route("/count")
	.get(...adminGuard(adminLimiter), reviewController.count);

adminRouter
	.route("/exists/:reviewId")
	.get(...adminGuard(adminLimiter), reviewController.existsById);

adminRouter
	.route("/:reviewId")
	.get(...adminGuard(adminLimiter), reviewController.getById);

protectedRoutes.use("/", userRouter);
protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", publicRouter);
baseRouter.use("/", protectedRoutes);

export default baseRouter;
