import { isValidObjectId } from "mongoose";
import z from "zod";

import { createPaginationSortSchema } from "../pagination/sort.schema.js";
import { selectReviewSchema } from "./review.schema.js";

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
const reviewSortableFields = selectReviewSchema.pick({
	createdAt: true,
	rating: true,
	updatedAt: true,
});

export const reviewPaginationSortSchema = createPaginationSortSchema(
	reviewSortableFields.keyof(),
);
