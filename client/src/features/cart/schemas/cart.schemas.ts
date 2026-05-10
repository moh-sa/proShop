import { productSchema } from "@/features/products/schemas";
import z from "zod";

export const cartItemToAddSchema = productSchema.pick({
	id: true,
	name: true,
	price: true,
	image: true,
	countInStock: true,
});

export const cartItemSchema = cartItemToAddSchema.extend({
	quantity: z.number().int().min(1),
});
