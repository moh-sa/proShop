import { Router } from "express";

import orderRoutes from "./order.routes.js";
import productRoutes from "./product.routes.js";
import reviewRoutes from "./reviews.routes.js";
import userRoutes from "./user.routes.js";
import webhooksRoutes from "./webhooks.routes.js";

const router = Router();

router.use("/products", productRoutes);
router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/webhooks", webhooksRoutes);

export default router;
