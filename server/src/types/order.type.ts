import type { z } from "zod";

import type {
	allOrdersResponseSchema,
	createOrderSchema,
	markAsBaseParamsSchema,
	markAsCancelledParamsSchema,
	markAsProcessingParamsSchema,
	orderModelSchema,
	orderPaginationFiltersSchema,
	orderPaginationSortSchema,
	orderSchema,
	orderStatusSchema,
} from "../schemas/index.js";
import type {
	createOrderItemSchema,
	orderItemSchema,
} from "../schemas/order/order-item.schema.js";
import type {
	PaginationFilter,
	PaginationParams,
	PaginationParamsStringified,
	PaginationSelect,
} from "./pagination.type.js";
import type { Stringify } from "./stringify.type.js";

export type CreateOrder = z.infer<typeof createOrderSchema>;
export type CreateOrderItem = z.infer<typeof createOrderItemSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderSchema = z.infer<typeof orderModelSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;

// Pagination
export type OrderFilter = PaginationFilter<
	z.infer<typeof orderPaginationFiltersSchema>
>;

export type OrderSelect = PaginationSelect<Order>;

export type OrderSort = z.infer<typeof orderPaginationSortSchema>;

// Method Params
export type GetAllOrdersByUserIdControllerParams = GetAllOrdersControllerParams;

export type GetAllOrdersControllerParams = PaginationParamsStringified & {
	sort?: string;
	status?: string;
};

export type GetAllOrdersManagerParams = GetAllOrdersServiceParams;

export type GetAllOrdersRepositoryParams = PaginationParams & {
	filters?: OrderFilter;
	select?: OrderSelect;
	sort?: OrderSort;
};

export type GetAllOrdersServiceParams = PaginationParamsStringified & {
	filters?: Stringify<OrderFilter>;
	sort?: string;
};

export type MarkAsBaseParams = z.infer<typeof markAsBaseParamsSchema>;

export type MarkAsCancelledParams = z.infer<typeof markAsCancelledParamsSchema>;

export type MarkAsProcessingParams = z.infer<
	typeof markAsProcessingParamsSchema
>;

// Method Response
/** Response from creating an order with checkout session */
export type AllOrdersResponse = z.infer<typeof allOrdersResponseSchema>;

export type CreateOrderResponse = {
	order: Order;
	session: {
		url: string;
	};
};
