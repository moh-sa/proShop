import { z } from "zod";

import { IMAGE_FIELD_NAME } from "../../constants/index.js";
import { objectIdValidator } from "../../validators/index.js";
import { insertImageSchema, selectImageSchema } from "./image.schema.js";

const baseProductSchema = z.object({
	brand: z.string().min(1, { error: "Brand is required." }),

	category: z.string().min(1, { error: "Category is required." }),

	countInStock: z.coerce
		.number()
		.int()
		.min(0, { error: "Count in stock is required." }),

	description: z.string().min(1, { error: "Description is required." }),

	name: z.string().min(1, { error: "Name is required." }),

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
