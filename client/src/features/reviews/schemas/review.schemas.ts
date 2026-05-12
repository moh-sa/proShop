import { userSchema } from "@/features/users";
import { idSchema, selectSchema } from "@/shared/schemas";
import z from "zod";

const commentSchema = z.string().trim().nonempty().max(2000);

const ratingSchema = z.number().int().min(0).max(5);

const userFieldsSchema = userSchema.pick({ id: true, name: true });

const baseSchema = z.object({
	rating: ratingSchema,
	comment: commentSchema,
	user: userFieldsSchema,
	productId: idSchema,
});

export const createReviewSchema = baseSchema;

export const createReviewInputSchema = baseSchema.pick({
	rating: true,
	comment: true,
});

export const reviewSchema = baseSchema.extend(selectSchema.shape);
