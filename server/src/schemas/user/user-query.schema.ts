import { z } from "zod";
import { emailValidator } from "../../validators/email.validator.js";

export const userQuerySchema = z.object({
	email: emailValidator.optional(),
	isAdmin: z.coerce.boolean().optional(),
	name: z.string().trim().optional(),
});
