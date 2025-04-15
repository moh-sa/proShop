import { Router } from "express";
import authRoutes from "./auth.routes";
import orderRoutes from "./order.routes";
import productRoutes from "./product.routes";
import reviewRoutes from "./reviews.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/products", productRoutes);
router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/auth", authRoutes);

export default router;
