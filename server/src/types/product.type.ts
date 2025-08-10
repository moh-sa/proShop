import type { z } from "zod";

import type {
	insertProductSchema,
	selectProductSchema,
} from "../schemas/index.js";

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
