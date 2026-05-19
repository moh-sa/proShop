import type { z } from "zod";
import type {
	createOrderSchema,
	orderItemSchema,
	orderSchema,
} from "../schemas";

export type OrderItem = z.infer<typeof orderItemSchema>;
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type Order = z.infer<typeof orderSchema>;
