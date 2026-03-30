import type { z } from "zod";

import type {
	allOrdersResponseSchema,
	insertOrderSchema,
	markAsBaseParamsSchema,
	markAsCancelledParamsSchema,
	markAsProcessingParamsSchema,
	orderPaginationFiltersSchema,
	orderPaginationSortSchema,
	orderStatusSchema,
	selectOrderSchema,
} from "../schemas/index.js";
import type {
	insertOrderItemSchema,
	selectOrderItemSchema,
} from "../schemas/order/order-item.schema.js";
import type {
	PaginationFilter,
	PaginationParams,
	PaginationParamsStringified,
	PaginationSelect,
} from "./pagination.type.js";
import type { Stringify } from "./stringify.type.js";

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderSchema = SelectOrder;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type SelectOrder = z.infer<typeof selectOrderSchema>;
export type SelectOrderItem = z.infer<typeof selectOrderItemSchema>;

// Pagination
export type OrderFilter = PaginationFilter<
	z.infer<typeof orderPaginationFiltersSchema>
>;

export type OrderSelect = PaginationSelect<SelectOrder>;

export type OrderSort = z.infer<typeof orderPaginationSortSchema>;

// Method Params
export type GetAllOrdersByUserIdControllerParams =
	GetAllOrdersControllerParams & {
		userId: string;
	};

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
	order: SelectOrder;
	session: {
		url: string;
	};
};
