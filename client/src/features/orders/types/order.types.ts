import type { z } from "zod";
import type {
	createOrderSchema,
	orderItemSchema,
	orderListItemSchema,
	orderSchema,
	orderStatusSchema,
} from "../schemas";

export type OrderItem = z.infer<typeof orderItemSchema>;
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderListItem = z.infer<typeof orderListItemSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
