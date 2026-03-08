import { z } from "zod";

import { objectIdValidator } from "../../validators/index.js";
import { selectProductSchema } from "../product/product.schema.js";

const baseOrderItemSchema = selectProductSchema
	.pick({ image: true, name: true, price: true })
	.extend({
		product: objectIdValidator,
		qty: z.number().int().min(1),
	});

export const insertOrderItemSchema = baseOrderItemSchema;
export const selectOrderItemSchema = baseOrderItemSchema;
