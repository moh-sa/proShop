import express from "express";

import { getLoggerFromContext } from "../../utils/logger.util.js";

const router = express.Router();

router.post("/stripe", async (req, res) => {
	const logger = getLoggerFromContext().child({ route: "webhooks/stripe" });
	logger.debug("Receiving webhook");

	// const payload = req.body as Buffer; - disabled temporarily
	const signature = req.headers["stripe-signature"];

	// Validate header exists and is a string
	if (!signature || typeof signature !== "string") {
		logger.warn("Missing or invalid stripe-signature header");
		return res.status(400).json({ error: "Missing webhook signature" });
	}

	logger.debug({ signature }, "Stripe signature header");

	// TODO: call order controller to process webhook

	logger.info("Stripe webhook processed successfully");
	return res.status(200).json({ success: true });
});

export default router;
