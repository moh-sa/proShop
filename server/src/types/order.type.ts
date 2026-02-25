import type { z } from "zod";

import type {
	allOrdersResponseSchema,
	insertOrderSchema,
	markAsBaseParamsSchema,
	markAsCancelledParamsSchema,
	markAsProcessingParamsSchema,
	orderStatusSchema,
	selectOrderSchema,
} from "../schemas/index.js";
import type {
	insertOrderItemSchema,
	selectOrderItemSchema,
} from "../schemas/order/order-item.schema.js";
import type { PaginationParamsString } from "./pagination.type.js";

export type AllOrdersResponse = z.infer<typeof allOrdersResponseSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderSchema = SelectOrder;
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export type SelectOrder = z.infer<typeof selectOrderSchema>;
export type SelectOrderItem = z.infer<typeof selectOrderItemSchema>;

// Pagination
export type OrderPaginationParams = PaginationParamsString & {
	status?: string;
	user?: string;
};

/** Response from creating an order with checkout session */
export type CreateOrderResponse = {
	order: SelectOrder;
	session: {
		url: string;
	};
};

export type MarkAsBaseParams = z.infer<typeof markAsBaseParamsSchema>;

export type MarkAsCancelledParams = z.infer<typeof markAsCancelledParamsSchema>;

export type MarkAsProcessingParams = z.infer<
	typeof markAsProcessingParamsSchema
>;
