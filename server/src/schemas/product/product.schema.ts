import { z } from "zod";
import { objectIdValidator } from "../../validators";

const baseProductSchema = z.object({
  user: objectIdValidator,

  name: z.string().min(1, { message: "Name is required." }),

  image: z.string().min(1, { message: "Image is required." }),

  brand: z.string().min(1, { message: "Brand is required." }),

  category: z.string().min(1, { message: "Category is required." }),

  description: z.string().min(1, { message: "Description is required." }),

  rating: z
    .number()
    .min(0, { message: "Rating is required." })
    .max(5, { message: "Rating must be between 1 and 5." })
    .default(0),

  numReviews: z
    .number()
    .int()
    .min(0, { message: "Number of reviews is required." })
    .default(0),

  price: z.number().min(0, { message: "Price is required." }).default(0),

  countInStock: z
    .number()
    .int()
    .min(0, { message: "Count in stock is required." })
    .default(0),
});

export const insertProductSchema = baseProductSchema;

export const selectProductSchema = baseProductSchema.extend({
  _id: objectIdValidator,
  createdAt: z.date(),
  updatedAt: z.date(),
});
