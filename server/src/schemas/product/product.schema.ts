import { z } from "zod";

import { IMAGE_FIELD_NAME } from "../../constants/index.js";
import {
	nonEmptyStringValidator,
	objectIdValidator,
} from "../../validators/index.js";
import { insertImageSchema, selectImageSchema } from "./image.schema.js";

const baseProductSchema = z.object({
	brand: nonEmptyStringValidator("brand"),

	category: nonEmptyStringValidator("category"),

	countInStock: z.coerce
		.number()
		.int()
		.min(0, { error: "Count in stock is required." }),

	description: nonEmptyStringValidator("description"),

	name: nonEmptyStringValidator("name"),

	price: z.coerce.number().min(0, { error: "Price is required." }),

	user: objectIdValidator,
});

export const insertProductSchema = baseProductSchema.extend({
	[IMAGE_FIELD_NAME]: insertImageSchema.optional(),
});

export const selectProductSchema = baseProductSchema.extend({
	_id: objectIdValidator,
	createdAt: z.date(),

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
