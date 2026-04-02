import z from "zod";

import { selectProductSchema } from "./product.schema.js";

export const productPaginationFiltersSchema = selectProductSchema
	.pick({
		brand: true,
		category: true,
	})
	.extend({
		keyword: z.string().trim().optional(),
	})
	.partial();
