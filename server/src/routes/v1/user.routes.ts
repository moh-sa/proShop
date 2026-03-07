import express from "express";

import { userController } from "../../controllers/index.js";
import { adminGuard, userGuard } from "../../middlewares/index.js";
import {
	adminLimiter,
	defaultLimiter,
	strictLimiter,
} from "../../services/index.js";

const router = express.Router();

// User routes
router
	.route("/profile")
	.get(...userGuard(defaultLimiter), userController.getById);

router
	.route("/profile")
	.patch(...userGuard(strictLimiter), userController.update);

// Admin routes
router.route("/").get(...adminGuard(adminLimiter), userController.getAll);

router
	.route("/:userId")
	.get(...adminGuard(adminLimiter), userController.getById);

router
	.route("/:userId")
	.patch(...adminGuard(adminLimiter), userController.update);

router
	.route("/:userId")
	.delete(...adminGuard(adminLimiter), userController.delete);

export default router;
