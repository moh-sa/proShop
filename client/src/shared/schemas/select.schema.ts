import z from "zod";
import { idSchema } from "./id.schema";

export const selectSchema = z.object({
	id: idSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
});
