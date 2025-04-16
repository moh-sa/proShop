import { z } from "zod";
import { insertProductSchema, selectProductSchema } from "../schemas";

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type SelectProduct = z.infer<typeof selectProductSchema>;
export type ProductSchema = SelectProduct;

export type TopRatedProduct = Pick<
  SelectProduct,
  "_id" | "name" | "price" | "image"
>;

export type AllProducts = Pick<
  SelectProduct,
  "_id" | "name" | "brand" | "category" | "price" | "rating" | "image"
>;

export type InsertProductWithStringImage = Omit<InsertProduct, "image"> & {
  image: string;
};
