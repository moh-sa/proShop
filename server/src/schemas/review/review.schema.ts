import { z } from "zod";

import {
	nonEmptyStringValidator,
	objectIdStringValidator,
	objectIdValidator,
} from "../../validators/index.js";

const baseSchema = z.object({
	comment: nonEmptyStringValidator("comment"),
	name: nonEmptyStringValidator("name"),

	product: objectIdStringValidator,

	rating: z.coerce
		.number()
		.positive({ error: "Rating must be a positive number." })
		.max(5, { error: "Rating must be between 1 and 5." }),

	user: objectIdStringValidator,
});

export const createReviewSchema = baseSchema;

export const reviewSchema = baseSchema.extend({
	createdAt: z.date(),
	id: objectIdStringValidator,
	updatedAt: z.date(),
});

export const reviewModelSchema = reviewSchema.extend({
	id: objectIdValidator,
	product: objectIdValidator,
	user: objectIdValidator,
});
