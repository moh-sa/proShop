import express from "express";

import { uploadSingle as uploadSingleMiddleware } from "../../config/multer.config.js";
import { ProductController } from "../../controllers/index.js";
import {
	checkIfUserIsAdmin,
	checkUserIdExists,
} from "../../middlewares/index.js";
import { adminLimiter, defaultLimiter } from "../../services/index.js";

const controller = new ProductController();

const baseRouter = express.Router();

const publicRouter = express.Router();

const protectedRoutes = express.Router();
const adminRouter = express.Router();

publicRouter.route("/").get(defaultLimiter, controller.getAll);

publicRouter.route("/top-rated").get(defaultLimiter, controller.getTopRated);

adminRouter
	.route("/")
	.post(
		adminLimiter,
		checkUserIdExists,
		checkIfUserIsAdmin,
		uploadSingleMiddleware,
		controller.create,
	);

adminRouter
	.route("/:productId")
	.get(defaultLimiter, controller.getById)
	.delete(
		adminLimiter,
		checkUserIdExists,
		checkIfUserIsAdmin,
		controller.delete,
	)
	.patch(
		adminLimiter,
		checkUserIdExists,
		checkIfUserIsAdmin,
		uploadSingleMiddleware,
		controller.update,
	);

protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", publicRouter);
baseRouter.use("/", protectedRoutes);

export default baseRouter;
