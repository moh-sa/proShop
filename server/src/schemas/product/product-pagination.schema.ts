import z from "zod";

import { paginationParamsSchema } from "../pagination/pagination.schema.js";
import { createPaginationSortSchema } from "../pagination/sort.schema.js";
import { productSchema } from "./product.schema.js";

export const productPaginationFiltersSchema = productSchema
	.pick({
		brand: true,
		category: true,
	})
	.extend({
		keyword: z.string().trim().optional(),
	})
	.partial();

const productSortableFields = productSchema.pick({
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

export const productPaginationParamsSchema = paginationParamsSchema.extend({
	filters: productPaginationFiltersSchema.optional(),
	sort: productPaginationSortSchema.optional(),
});
