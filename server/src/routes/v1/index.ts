import { Router } from "express";

import authRoutes from "./auth.routes.js";
import orderRoutes from "./order.routes.js";
import productRoutes from "./product.routes.js";
import reviewRoutes from "./reviews.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/products", productRoutes);
router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/auth", authRoutes);

export default router;
