import express from "express";

import { orderController } from "../../controllers/index.js";
import { adminGuard, userGuard } from "../../middlewares/index.js";
import { defaultLimiter, strictLimiter } from "../../services/index.js";

const router = express.Router();

// User routes
router.route("/").post(...userGuard(strictLimiter), orderController.create);

router
	.route("/user/:userId")
	.get(...userGuard(defaultLimiter), orderController.getAllByUserId);

router
	.route("/:orderId")
	.get(...userGuard(defaultLimiter), orderController.getById);

// User routes
router
	.route("/:orderId/cancel")
	.patch(...userGuard(strictLimiter), orderController.cancelOrder);

// Admin routes
router.route("/").get(...adminGuard(defaultLimiter), orderController.getAll);

router
	.route("/:orderId/payment")
	.patch(...adminGuard(strictLimiter), orderController.updatePayment);

router
	.route("/:orderId/deliver")
	.patch(...adminGuard(strictLimiter), orderController.markAsDelivered);

router
	.route("/:orderId/admin/cancel")
	.patch(...adminGuard(strictLimiter), orderController.adminCancelOrder);

export default router;
