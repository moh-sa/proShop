import type { z } from "zod";

import type {
	insertProductSchema,
	productPaginationFiltersSchema,
	productPaginationSortSchema,
	selectProductSchema,
} from "../schemas/index.js";
import type { PaginationFilter, PaginationSelect } from "./pagination.type.js";

export type AllProducts = Pick<
	SelectProduct,
	"_id" | "brand" | "category" | "image" | "name" | "price" | "rating"
>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertProductWithStringImage = Omit<InsertProduct, "image"> & {
	image: string;
};

export type ProductSchema = SelectProduct;

export type SelectProduct = z.infer<typeof selectProductSchema>;

export type TopRatedProduct = Pick<
	SelectProduct,
	"_id" | "image" | "name" | "price"
>;

// Pagination
export type ProductFilter = PaginationFilter<
	z.infer<typeof productPaginationFiltersSchema>
>;

export type ProductSelect = PaginationSelect<SelectProduct>;

export type ProductSort = z.infer<typeof productPaginationSortSchema>;
