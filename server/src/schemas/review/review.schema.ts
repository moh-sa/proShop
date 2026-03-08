import { z } from "zod";

import {
	nonEmptyStringValidator,
	objectIdValidator,
} from "../../validators/index.js";

const baseReviewSchema = z.object({
	comment: nonEmptyStringValidator("comment"),
	name: nonEmptyStringValidator("name"),

	product: objectIdValidator,

	rating: z.coerce
		.number()
		.positive({ error: "Rating must be a positive number." })
		.max(5, { error: "Rating must be between 1 and 5." }),

	user: objectIdValidator,
});

export const insertReviewSchema = baseReviewSchema;

export const selectReviewSchema = baseReviewSchema.extend({
	_id: objectIdValidator,
	createdAt: z.date(),
	updatedAt: z.date(),
});
