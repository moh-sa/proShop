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

// Admin route
router.route("/").get(...adminGuard(defaultLimiter), orderController.getAll);

router
	.route("/:orderId/payment")
	.patch(...adminGuard(strictLimiter), orderController.updatePayment);

export default router;
