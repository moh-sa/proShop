import {
	paginationParamsSchema,
	type PaginationParams,
} from "@/features/pagination";
import {
	buildSearchParams,
	ClientApiError,
	get,
	getPaginated,
	normalizeError,
	post,
	type ApiPaginatedResponse,
} from "@/shared/api";
import { idSchema } from "@/shared/schemas";
import {
	createOrderResponseSchema,
	createOrderSchema,
	orderListItemSchema,
	orderSchema,
} from "../schemas";
import type { CreateOrder, Order, OrderListItem } from "../types";

export async function createOrderApi(data: CreateOrder) {
	const parsedData = createOrderSchema.safeParse(data);
	if (!parsedData.success) {
		throw new ClientApiError(normalizeError(parsedData.error, "input"));
	}

	const response = await post(
		"/orders",
		parsedData.data,
		createOrderResponseSchema,
	);
	return response;
}

export async function getUserPaginatedOrdersApi(
	userId: string,
	params: PaginationParams,
	signal: AbortSignal,
): Promise<ApiPaginatedResponse<OrderListItem>> {
	const parsedUserId = idSchema.safeParse(userId);
	if (!parsedUserId.success) {
		throw new ClientApiError(normalizeError(parsedUserId.error, "input"));
	}

	const parsedParams = paginationParamsSchema
		.transform(buildSearchParams)
		.safeParse(params);
	if (!parsedParams.success) {
		throw new ClientApiError(normalizeError(parsedParams.error, "input"));
	}

	return await getPaginated(
		`/orders/user/${parsedUserId.data}?${parsedParams.data}`,
		orderListItemSchema,
		signal,
	);
}

export async function getOrderDetailApi(
	orderId: string,
	signal: AbortSignal,
): Promise<Order> {
	const parsedOrderId = idSchema.safeParse(orderId);
	if (!parsedOrderId.success) {
		throw new ClientApiError(normalizeError(parsedOrderId.error, "input"));
	}

	return await get(`/orders/${parsedOrderId.data}`, orderSchema, signal);
}
