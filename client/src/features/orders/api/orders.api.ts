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
	patch,
	post,
	type ApiPaginatedResponse,
} from "@/shared/api";
import { idSchema } from "@/shared/schemas";
import {
	createOrderResponseSchema,
	createOrderSchema,
	orderListItemSchema,
	orderSchema,
	orderStatusSchema,
} from "../schemas";
import type { CreateOrder, Order, OrderListItem, OrderStatus } from "../types";

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

export async function getAdminOrdersApi(
	params: PaginationParams & { status?: OrderStatus },
	signal: AbortSignal,
): Promise<ApiPaginatedResponse<OrderListItem>> {
	const parsedParams = paginationParamsSchema
		.extend({ status: orderStatusSchema.optional() })
		.transform(buildSearchParams)
		.safeParse(params);
	if (!parsedParams.success) {
		throw new ClientApiError(normalizeError(parsedParams.error, "input"));
	}

	return await getPaginated(
		`/orders?${parsedParams.data}`,
		orderListItemSchema,
		signal,
	);
}

export async function getAdminOrderDetailApi(
	orderId: string,
	signal: AbortSignal,
): Promise<Order> {
	const parsedId = idSchema.safeParse(orderId);
	if (!parsedId.success) {
		throw new ClientApiError(normalizeError(parsedId.error, "input"));
	}

	return await get(`/orders/${parsedId.data}`, orderSchema, signal);
}

export async function markOrderAsDeliveredApi(orderId: string): Promise<Order> {
	const parsedId = idSchema.safeParse(orderId);
	if (!parsedId.success) {
		throw new ClientApiError(normalizeError(parsedId.error, "input"));
	}

	return await patch(`/orders/${parsedId.data}/deliver`, {}, orderSchema);
}

export async function cancelOrderApi(orderId: string): Promise<Order> {
	const parsedId = idSchema.safeParse(orderId);
	if (!parsedId.success) {
		throw new ClientApiError(normalizeError(parsedId.error, "input"));
	}

	return await patch(`/orders/${parsedId.data}/cancel`, {}, orderSchema);
}

export async function adminCancelOrderApi(orderId: string): Promise<Order> {
	const parsedId = idSchema.safeParse(orderId);
	if (!parsedId.success) {
		throw new ClientApiError(normalizeError(parsedId.error, "input"));
	}

	return await patch(`/orders/${parsedId.data}/admin/cancel`, {}, orderSchema);
}
