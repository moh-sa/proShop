import { z } from "zod";

import { objectIdValidator } from "../../validators/index.js";
import { productSchema } from "../product/product.schema.js";

const baseOrderItemSchema = productSchema
	.pick({ image: true, name: true, price: true })
	.extend({
		product: objectIdValidator,
		qty: z.number().int().min(1),
	});

export const createOrderItemSchema = baseOrderItemSchema;
export const orderItemSchema = baseOrderItemSchema;
