import { Router } from "express";
import orderRoute from "./orderRoutes";
import productRoute from "./productRoutes";
import reviewRoute from "./review.route";
import uploadRoute from "./uploadRoutes";
import userRoute from "./userRoutes";

const router = Router();

router.use("/products", productRoute);
router.use("/users", userRoute);
router.use("/orders", orderRoute);
router.use("/uploads", uploadRoute);
router.use("/reviews", reviewRoute);

export default router;
