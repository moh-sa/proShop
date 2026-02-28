import express from "express";

import { uploadSingle as uploadSingleMiddleware } from "../../config/multer.config.js";
import { productController } from "../../controllers/index.js";
import {
	authenticate,
	authorizeAdmin,
	checkUserExists,
} from "../../middlewares/index.js";
import { adminLimiter, defaultLimiter } from "../../services/index.js";

const baseRouter = express.Router();

const publicRouter = express.Router();

const protectedRoutes = express.Router();
const adminRouter = express.Router();

publicRouter.route("/").get(defaultLimiter, productController.getAll);

publicRouter
	.route("/top-rated")
	.get(defaultLimiter, productController.getTopRated);

adminRouter
	.route("/")
	.post(
		adminLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		uploadSingleMiddleware,
		productController.create,
	);

adminRouter.route("/:productId").get(defaultLimiter, productController.getById);

adminRouter
	.route("/:productId")
	.delete(
		adminLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		productController.delete,
	);

adminRouter
	.route("/:productId")
	.patch(
		adminLimiter,
		authenticate,
		checkUserExists,
		authorizeAdmin,
		uploadSingleMiddleware,
		productController.update,
	);

protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", publicRouter);
baseRouter.use("/", protectedRoutes);

export default baseRouter;
