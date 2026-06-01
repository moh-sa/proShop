import { Router } from "express";

import authRoutes from "./auth.routes.js";
import orderRoutes from "./order.routes.js";
import productRoutes from "./product.routes.js";
import reviewRoutes from "./reviews.routes.js";
import statsRoutes from "./stats.routes.js";
import userRoutes from "./user.routes.js";
import webhooksRoutes from "./webhooks.routes.js";

const router = Router();

router.use("/products", productRoutes);
router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/auth", authRoutes);
router.use("/webhooks", webhooksRoutes);
router.use("/stats", statsRoutes);

export default router;
