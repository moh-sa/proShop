import { z } from "zod";
import { objectIdValidator } from "../../validators";
import { insertProductSchema } from "../product/product.schema";

const baseOrderItemSchema = insertProductSchema
  .pick({ name: true, image: true, price: true })
  .extend({
    qty: z.number().int().min(1).default(1),
    product: objectIdValidator,
  });

export const insertOrderItemSchema = baseOrderItemSchema;
export const selectOrderItemSchema = baseOrderItemSchema;
