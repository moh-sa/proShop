import express from "express";

import { uploadSingle as uploadSingleMiddleware } from "../../config/multer.config.js";
import { productController } from "../../controllers/index.js";
import { adminGuard } from "../../middlewares/index.js";
import { adminLimiter, defaultLimiter } from "../../services/index.js";

const baseRouter = express.Router();

const publicRouter = express.Router();

const protectedRoutes = express.Router();
const adminRouter = express.Router();

publicRouter.route("/").get(defaultLimiter, productController.getAll);

publicRouter
	.route("/top-rated")
	.get(defaultLimiter, productController.getTopRated);

publicRouter
	.route("/:productId")
	.get(defaultLimiter, productController.getById);

adminRouter
	.route("/")
	.post(
		...adminGuard(adminLimiter),
		uploadSingleMiddleware,
		productController.create,
	);

adminRouter
	.route("/:productId")
	.delete(...adminGuard(adminLimiter), productController.delete);

adminRouter
	.route("/:productId")
	.patch(
		...adminGuard(adminLimiter),
		uploadSingleMiddleware,
		productController.update,
	);

protectedRoutes.use("/admin", adminRouter);

baseRouter.use("/", publicRouter);
baseRouter.use("/", protectedRoutes);

export default baseRouter;
