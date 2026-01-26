import { z } from "zod";

export const createCheckoutSessionItem = z.object({
	imageUrl: z.string().min(1).url(),
	name: z.string().min(1),
	quantity: z.number().int().min(1),
	unitAmount: z.number().int().min(1),
});

export const createCheckoutSessionParamsSchema = z.object({
	cancelUrl: z.string().min(1).url(),
	currency: z.string().min(1).max(3).toLowerCase(),
	items: z.array(createCheckoutSessionItem).min(1),
	orderId: z.string().min(1),
	successUrl: z.string().min(1).url(),
	userEmail: z.string().min(1).email(),
});
