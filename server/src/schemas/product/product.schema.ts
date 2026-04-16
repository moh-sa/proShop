import { z } from "zod";

import { IMAGE_FIELD_NAME } from "../../constants/index.js";
import {
	nonEmptyStringValidator,
	objectIdStringValidator,
	objectIdValidator,
} from "../../validators/index.js";
import { insertImageSchema, selectImageSchema } from "./image.schema.js";

const baseSchema = z.object({
	brand: nonEmptyStringValidator("brand"),

	category: nonEmptyStringValidator("category"),

	countInStock: z.coerce
		.number()
		.int()
		.min(0, { error: "Count in stock is required." }),

	description: nonEmptyStringValidator("description"),

	name: nonEmptyStringValidator("name"),

	price: z.coerce.number().min(0, { error: "Price is required." }),

	user: objectIdStringValidator,
});

export const createProductUploadSchema = baseSchema.extend({
	[IMAGE_FIELD_NAME]: insertImageSchema,
});

export const createProductSchema = baseSchema.extend({
	[IMAGE_FIELD_NAME]: selectImageSchema,
});

export const createProductBodySchema = baseSchema.omit({ user: true });

export const updateProductBodySchema = baseSchema
	.omit({ user: true })
	.partial();

export const updateProductUploadSchema = createProductUploadSchema
	.omit({ user: true })
	.partial();

export const updateProductSchema = createProductSchema
	.omit({ user: true })
	.partial();

export const productSchema = baseSchema.extend({
	createdAt: z.date(),
	id: objectIdStringValidator,

	[IMAGE_FIELD_NAME]: selectImageSchema,
	numReviews: z
		.number()
		.int()
		.min(0, { error: "Number of reviews is required." }),
	rating: z
		.number()
		.min(0, { error: "Rating is required." })
		.max(5, { error: "Rating must be between 1 and 5." }),
	updatedAt: z.date(),
});

export const productModelSchema = productSchema.extend({
	id: objectIdValidator,
	user: objectIdValidator,
});
