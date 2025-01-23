import { Router } from "express";
import orderRoute from "./orderRoutes";
import productRoute from "./productRoutes";
import uploadRoute from "./uploadRoutes";
import userRoute from "./userRoutes";

const router = Router();

router.use("/products", productRoute);
router.use("/users", userRoute);
router.use("/orders", orderRoute);
router.use("/uploads", uploadRoute);

export default router;
