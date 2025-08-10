import type { z } from "zod";

import type {
	allOrdersResponseSchema,
	insertOrderSchema,
	selectOrderSchema,
} from "../schemas/index.js";
import type {
	insertOrderItemSchema,
	selectOrderItemSchema,
} from "../schemas/order/order-item.schema.js";

export type AllOrdersResponse = z.infer<typeof allOrdersResponseSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderSchema = SelectOrder;

export type SelectOrder = z.infer<typeof selectOrderSchema>;
export type SelectOrderItem = z.infer<typeof selectOrderItemSchema>;
