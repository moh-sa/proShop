import type { z } from "zod";

import type {
	createProductSchema,
	productModelSchema,
	productPaginationFiltersSchema,
	productPaginationSortSchema,
	productSchema,
} from "../schemas/index.js";
import type {
	PaginationFilter,
	PaginationParams,
	PaginationParamsStringified,
	PaginationSelect,
} from "./pagination.type.js";
import type { Stringify } from "./stringify.type.js";

export type AllProducts = Pick<
	Product,
	"_id" | "brand" | "category" | "image" | "name" | "price" | "rating"
>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type CreateProductWithStringImage = Omit<CreateProduct, "image"> & {
	image: string;
};

export type Product = z.infer<typeof productSchema>;

export type ProductSchema = z.infer<typeof productModelSchema>;

export type TopRatedProduct = Pick<Product, "_id" | "image" | "name" | "price">;

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
