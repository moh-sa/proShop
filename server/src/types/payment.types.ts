import type Stripe from "stripe";
import type { z } from "zod";

import type {
	createCheckoutSessionItem,
	createCheckoutSessionParamsSchema,
	paymentProviderSchema,
} from "../schemas/index.js";

export type CreateCheckoutSessionParams = z.infer<
	typeof createCheckoutSessionParamsSchema
>;

export interface CreateCheckoutSessionResponse {
	id: string;
	url: string;
}

export type LineItem = z.infer<typeof createCheckoutSessionItem>;

export type LineItems = Array<LineItem>;

export type PaymentProvider = z.infer<typeof paymentProviderSchema>;

export interface VerifyWebhookParams {
	/** **MUST** be raw body, not parsed JSON */
	payload: Buffer;
	signature: string;
}

export interface VerifyWebhookResponse {
	metadata: {
		orderId: string;
	};
	type: Stripe.Event.Type;
}
