import { z } from "zod";
import { selectProductSchema } from "./product.type";

export const orderItemSchema = selectProductSchema.extend({
  qty: z.number().int().min(1).default(1),
});
