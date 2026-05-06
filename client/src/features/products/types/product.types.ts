import type z from "zod";
import type {
	createProductSchema,
	productSchema,
	updateProductSchema,
} from "../schemas";

export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type Product = z.infer<typeof productSchema>;
