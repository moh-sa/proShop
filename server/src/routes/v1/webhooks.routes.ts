import express from "express";

import { OrderController } from "../../controllers/index.js";

const router = express.Router();
const orderController = new OrderController();

router.post("/stripe", orderController.handleStripeWebhook);

export default router;
