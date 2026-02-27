import express from "express";

import { orderController } from "../../controllers/index.js";

const router = express.Router();

router.post("/stripe", orderController.handleStripeWebhook);

export default router;
