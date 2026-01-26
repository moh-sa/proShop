import type { z } from "zod";

import type {
	createCheckoutSessionItem,
	createCheckoutSessionParamsSchema,
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
