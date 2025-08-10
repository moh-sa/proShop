import { z } from "zod";

import { objectIdValidator } from "../../validators/index.js";

const baseReviewSchema = z.object({
	comment: z.string().min(1, { message: "Comment is required." }),
	name: z.string().min(1, { message: "Name is required." }),

	product: objectIdValidator,

	rating: z.coerce
		.number()
		.positive({ message: "Rating must be a positive number." })
		.max(5, { message: "Rating must be between 1 and 5." }),

	user: objectIdValidator,
});

export const insertReviewSchema = baseReviewSchema;

export const selectReviewSchema = baseReviewSchema.extend({
	_id: objectIdValidator,
	createdAt: z.date(),
	updatedAt: z.date(),
});
