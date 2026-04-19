import type Stripe from "stripe";
import type { z } from "zod";

import type {
	createCheckoutSessionItemSchema,
	createCheckoutSessionParamsSchema,
} from "../schemas/index.js";

export type CreateCheckoutSessionParams = z.infer<
	typeof createCheckoutSessionParamsSchema
>;

export interface CreateCheckoutSessionResponse {
	id: string;
	url: string;
}

export type LineItem = z.infer<typeof createCheckoutSessionItemSchema>;

export interface VerifyWebhookParams {
	/** **MUST** be raw body, not parsed JSON */
	payload: Buffer;
	signature: string;
}

export interface VerifyWebhookResponse {
	metadata: {
		orderId: string;
	};
	paidAt: Date;
	type: Stripe.Event.Type;
}
