import z from "zod";

import { createPaginationSortSchema } from "../pagination/sort.schema.js";
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

const productSortableFields = selectProductSchema.pick({
	countInStock: true,
	createdAt: true,
	numReviews: true,
	price: true,
	rating: true,
	updatedAt: true,
});

export const productPaginationSortSchema = createPaginationSortSchema(
	productSortableFields.keyof(),
);
