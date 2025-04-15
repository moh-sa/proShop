import { z } from "zod";
import { objectIdValidator } from "../../validators";
import { selectProductSchema } from "../product/product.schema";

const baseOrderItemSchema = selectProductSchema
  .pick({ name: true, image: true, price: true })
  .extend({
    qty: z.number().int().min(1).default(1),
    product: objectIdValidator,
  });

export const insertOrderItemSchema = baseOrderItemSchema;
export const selectOrderItemSchema = baseOrderItemSchema;
