import { z } from "zod";
import { urlValidator } from "../../validators/url.validator.js";

export const createCheckoutSessionItem = z.object({
	name: z.string().min(1),
	quantity: z.number().int().min(1),
	unitAmount: z.number().int().min(1),
});

export const createCheckoutSessionParamsSchema = z.object({
	cancelUrl: urlValidator,
	currency: z.string().min(1).max(3).toLowerCase(),
	items: z.array(createCheckoutSessionItem).min(1),
	orderId: z.string().min(1),
	successUrl: urlValidator,
	userEmail: z.email(),
});
