import { Router } from "express";
import orderRoute from "./order.routes";
import productRoute from "./product.routes";
import reviewRoute from "./reviews.routes";
import uploadRoute from "./upload.routes";
import userRoute from "./user.routes";

const router = Router();

router.use("/products", productRoute);
router.use("/users", userRoute);
router.use("/orders", orderRoute);
router.use("/uploads", uploadRoute);
router.use("/reviews", reviewRoute);

export default router;
