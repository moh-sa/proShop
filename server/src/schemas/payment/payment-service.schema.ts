import { z } from "zod";

import { emailValidator } from "../../validators/email.validator.js";
import { nonEmptyStringValidator } from "../../validators/non-empty-string.validator.js";
import { urlValidator } from "../../validators/url.validator.js";

export const createCheckoutSessionItemSchema = z.object({
	name: nonEmptyStringValidator("name"),
	quantity: z.number().int().min(1),
	unitAmount: z.number().int().min(1),
});

export const createCheckoutSessionParamsSchema = z.object({
	cancelUrl: urlValidator,
	currency: nonEmptyStringValidator("currency").max(3).toLowerCase(),
	items: z.array(createCheckoutSessionItemSchema).min(1),
	orderId: nonEmptyStringValidator("order ID"),
	successUrl: urlValidator,
	userEmail: emailValidator,
});
