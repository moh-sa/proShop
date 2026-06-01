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

const router = express.Router();

// Public routes
router
	.route("/product/:productId")
	.get(defaultLimiter, reviewController.getAllByProductId);

router
	.route("/count/product/:productId")
	.get(defaultLimiter, reviewController.countByProductId);

// User routes
router.route("/").post(...userGuard(strictLimiter), reviewController.create);

router
	.route("/count/user/:userId")
	.get(...userGuard(defaultLimiter), reviewController.countByUserId);

router
	.route("/exists/user/:userId/product/:productId")
	.get(
		...userGuard(defaultLimiter),
		reviewController.existsByUserIdAndProductId,
	);

router
	.route("/user/:userId")
	.get(...userGuard(defaultLimiter), reviewController.getAllByUserId);

router
	.route("/:reviewId")
	.patch(
		...userGuard(strictLimiter),
		verifyReviewOwnership,
		reviewController.update,
	);

router
	.route("/:reviewId")
	.delete(
		...userGuard(defaultLimiter),
		verifyReviewOwnership,
		reviewController.delete,
	);

// Admin routes
router.route("/").get(...adminGuard(adminLimiter), reviewController.getAll);

router.route("/count").get(...adminGuard(adminLimiter), reviewController.count);

router
	.route("/exists/:reviewId")
	.get(...adminGuard(adminLimiter), reviewController.existsById);

router
	.route("/:reviewId")
	.get(...adminGuard(adminLimiter), reviewController.getById)
	.delete(...adminGuard(adminLimiter), reviewController.delete);

export default router;
