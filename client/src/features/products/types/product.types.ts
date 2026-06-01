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
/** Alias used by the product form component to indicate file upload input */
export type CreateProductFormInput = CreateProduct;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
/** Alias used by the product form component to indicate file upload input */
export type UpdateProductFormInput = UpdateProduct;
export type Product = z.infer<typeof productSchema>;

export type ProductTopRatedList = z.infer<typeof productTopRatedListSchema>;
export type ProductListItem = z.infer<typeof ProductListItemSchema>;
export type ProductSearchParams = z.infer<typeof productSearchParamsSchema>;
