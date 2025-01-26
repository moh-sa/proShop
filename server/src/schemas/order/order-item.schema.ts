import { z } from "zod";
import { objectIdValidator } from "../../validators";
import {
  insertProductSchema,
  selectProductSchema,
} from "../product/product.schema";

const baseOrderItemSchema = insertProductSchema
  .pick({ name: true, image: true, price: true })
  .extend({
    qty: z.number().int().min(1).default(1),
  });

export const insertOrderItemSchema = baseOrderItemSchema.extend({
  product: objectIdValidator,
});

export const selectOrderItemSchema = baseOrderItemSchema.extend({
  product: selectProductSchema,
});
