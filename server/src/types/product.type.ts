import type { z } from "zod";

import type {
	createProductBodySchema,
	createProductSchema,
	createProductUploadSchema,
	productModelSchema,
	productPaginationFiltersSchema,
	productPaginationSortSchema,
	productSchema,
	updateProductBodySchema,
	updateProductSchema,
	updateProductUploadSchema,
} from "../schemas/index.js";
import type {
	PaginationFilter,
	PaginationParams,
	PaginationParamsStringified,
	PaginationSelect,
} from "./pagination.type.js";
import type { Stringify } from "./stringify.type.js";

// Create
export type CreateProductUploadInput = z.infer<
	typeof createProductUploadSchema
>;

export type CreateProductBodyInput = z.infer<typeof createProductBodySchema>;

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Update
export type UpdateProductUploadInput = z.infer<
	typeof updateProductUploadSchema
>;

export type UpdateProductBodyInput = z.infer<typeof updateProductBodySchema>;

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export type AllProducts = Pick<
	Product,
	"brand" | "category" | "id" | "image" | "name" | "price" | "rating"
>;

export type Product = z.infer<typeof productSchema>;

export type ProductSchema = z.infer<typeof productModelSchema>;

export type TopRatedProduct = Pick<Product, "id" | "image" | "name" | "price">;

// Pagination
export type ProductFilter = PaginationFilter<
	z.infer<typeof productPaginationFiltersSchema>
>;

export type ProductSelect = PaginationSelect<Product>;

export type ProductSort = z.infer<typeof productPaginationSortSchema>;

// Method Params
export type GetAllProductsControllerParams = PaginationParamsStringified & {
	brand?: string;
	category?: string;
	keyword?: string;
	sort?: string;
};

export type GetAllProductsManagerParams = GetAllProductsServiceParams;

export type GetAllProductsRepositoryParams = PaginationParams & {
	filters?: ProductFilter;
	select?: ProductSelect;
	sort?: ProductSort;
};

export type GetAllProductsServiceParams = PaginationParamsStringified & {
	filters?: Stringify<ProductFilter>;
	sort?: string;
};
