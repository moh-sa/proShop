import express from "express";

import { uploadSingle as uploadSingleMiddleware } from "../../config/multer.config.js";
import { productController } from "../../controllers/index.js";
import { adminGuard } from "../../middlewares/index.js";
import { adminLimiter, defaultLimiter } from "../../services/index.js";

const router = express.Router();

// Public routes
router.route("/").get(defaultLimiter, productController.getAll);

router.route("/top-rated").get(defaultLimiter, productController.getTopRated);

router.route("/:productId").get(defaultLimiter, productController.getById);

// Admin routes
router
	.route("/")
	.post(
		...adminGuard(adminLimiter),
		uploadSingleMiddleware,
		productController.create,
	);

router
	.route("/:productId")
	.delete(...adminGuard(adminLimiter), productController.delete);

router
	.route("/:productId")
	.patch(
		...adminGuard(adminLimiter),
		uploadSingleMiddleware,
		productController.update,
	);

export default router;
