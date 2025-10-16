import { z } from "zod";

export const userQuerySchema = z.object({
	email: z.string().trim().email().optional(),
	isAdmin: z.coerce.boolean().optional(),
	name: z.string().trim().optional(),
});
