import { z } from "zod";

import { IMAGE_FIELD_NAME } from "../../constants/index.js";
import { objectIdValidator } from "../../validators/index.js";
import { insertImageSchema, selectImageSchema } from "./image.schema.js";

const baseProductSchema = z.object({
	brand: z.string().min(1, { message: "Brand is required." }),

	category: z.string().min(1, { message: "Category is required." }),

	countInStock: z.coerce
		.number()
		.int()
		.min(0, { message: "Count in stock is required." })
		.default(0),

	description: z.string().min(1, { message: "Description is required." }),

	name: z.string().min(1, { message: "Name is required." }),

	price: z.coerce.number().min(0, { message: "Price is required." }).default(0),

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
		.min(0, { message: "Number of reviews is required." }),
	rating: z
		.number()
		.min(0, { message: "Rating is required." })
		.max(5, { message: "Rating must be between 1 and 5." }),
	updatedAt: z.date(),
});
