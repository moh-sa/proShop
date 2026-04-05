import { isValidObjectId } from "mongoose";
import z from "zod";

import { paginationParamsSchema } from "../pagination/pagination.schema.js";
import { createPaginationSortSchema } from "../pagination/sort.schema.js";
import { reviewSchema } from "./review.schema.js";

// Filters
const baseFiltersSchema = z.object({
	productId: z
		.string()
		.trim()
		.refine((v) => isValidObjectId(v), {
			message: "Invalid product ID",
		}),
	userId: z
		.string()
		.trim()
		.refine((v) => isValidObjectId(v), {
			message: "Invalid user ID",
		}),
});

export const reviewPaginationFiltersSchema = baseFiltersSchema.partial();

export const reviewByProductIdPaginationFiltersSchema = baseFiltersSchema
	.pick({
		userId: true,
	})
	.partial();

export const reviewByUserIdPaginationFiltersSchema = baseFiltersSchema
	.pick({
		productId: true,
	})
	.partial();

// Sort
const reviewSortableFields = reviewSchema.pick({
	createdAt: true,
	rating: true,
	updatedAt: true,
});

export const reviewPaginationSortSchema = createPaginationSortSchema(
	reviewSortableFields.keyof(),
);

// Params
export const reviewPaginationParamsSchema = paginationParamsSchema.extend({
	filters: reviewPaginationFiltersSchema.optional(),
	sort: reviewPaginationSortSchema.optional(),
});

export const reviewByProductIdPaginationParamsSchema =
	reviewPaginationParamsSchema.extend({
		filters: reviewByProductIdPaginationFiltersSchema.optional(),
		productId: baseFiltersSchema.shape.productId,
	});

export const reviewByUserIdPaginationParamsSchema =
	reviewPaginationParamsSchema.extend({
		filters: reviewByUserIdPaginationFiltersSchema.optional(),
		userId: baseFiltersSchema.shape.userId,
	});
