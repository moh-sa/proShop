import { z } from "zod";
import { insertProductSchema, selectProductSchema } from "../schemas";

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type SelectProduct = z.infer<typeof selectProductSchema>;
export type ProductSchema = SelectProduct;
