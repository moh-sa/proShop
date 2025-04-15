import { z } from "zod";
import { IMAGE_FIELD_NAME } from "../../constants";
import { objectIdValidator } from "../../validators";
import { insertImageSchema, selectImageSchema } from "./image.schema";

const baseProductSchema = z.object({
  user: objectIdValidator,

  name: z.string().min(1, { message: "Name is required." }),

  brand: z.string().min(1, { message: "Brand is required." }),

  category: z.string().min(1, { message: "Category is required." }),

  description: z.string().min(1, { message: "Description is required." }),

  price: z.coerce.number().min(0, { message: "Price is required." }).default(0),

  countInStock: z.coerce
    .number()
    .int()
    .min(0, { message: "Count in stock is required." })
    .default(0),
});

export const insertProductSchema = baseProductSchema.extend({
  [IMAGE_FIELD_NAME]: insertImageSchema,
});

export const selectProductSchema = baseProductSchema.extend({
  _id: objectIdValidator,
  [IMAGE_FIELD_NAME]: selectImageSchema,

  rating: z
    .number()
    .min(0, { message: "Rating is required." })
    .max(5, { message: "Rating must be between 1 and 5." }),
  numReviews: z
    .number()
    .int()
    .min(0, { message: "Number of reviews is required." }),
  createdAt: z.date(),
  updatedAt: z.date(),
});
