import { z } from "zod";

import {
	nonEmptyStringValidator,
	objectIdStringValidator,
	objectIdValidator,
} from "../../validators/index.js";

const userFieldsSchema = z.object({
	id: objectIdStringValidator,
	name: nonEmptyStringValidator("user name"),
});

const baseSchema = z.object({
	comment: nonEmptyStringValidator("comment"),

	product: objectIdStringValidator,

	rating: z.coerce
		.number()
		.positive({ error: "Rating must be a positive number." })
		.max(5, { error: "Rating must be between 1 and 5." }),

	user: userFieldsSchema,
});

export const createReviewSchema = baseSchema;

export const updateReviewSchema = baseSchema
	.pick({ comment: true, rating: true })
	.partial()
	.extend({
		reviewId: objectIdStringValidator,
	});

export const updateReviewBodySchema = updateReviewSchema.omit({
	reviewId: true,
});

export const reviewSchema = baseSchema.extend({
	createdAt: z.date(),
	id: objectIdStringValidator,
	updatedAt: z.date(),
});

export const reviewModelSchema = reviewSchema.extend({
	id: objectIdValidator,
	product: objectIdValidator,
	user: userFieldsSchema.extend({
		id: objectIdValidator,
	}),
});
