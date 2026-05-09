import type z from "zod";
import type {
	createProductSchema,
	ProductListItemSchema,
	productSchema,
	productSearchParamsSchema,
	productTopRatedListSchema,
	updateProductSchema,
} from "../schemas";

export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type Product = z.infer<typeof productSchema>;

export type ProductTopRatedList = z.infer<typeof productTopRatedListSchema>;
export type ProductListItem = z.infer<typeof ProductListItemSchema>;
export type ProductSearchParams = z.infer<typeof productSearchParamsSchema>;
