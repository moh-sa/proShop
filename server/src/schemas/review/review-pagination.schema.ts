import { isValidObjectId } from "mongoose";
import z from "zod";

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
