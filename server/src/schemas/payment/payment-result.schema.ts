import { z } from "zod";

export const paymentResultSchema = z
	.object({
		id: z.string().min(1, { message: "payment ID is required." }),
	})
	.optional();
