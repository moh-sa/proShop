import {
	getAdminOrderDetailApi,
	getAdminOrdersApi,
} from "@/features/orders/api/orders.api";
import { orderKeys } from "@/features/orders/queries/order.keys";
import type { OrderStatus } from "@/features/orders/types";
import { type PaginationParams } from "@/features/pagination";
import {
	getAdminProductsApi,
	getProductByIdApi,
} from "@/features/products/api/product.api";
import { productKeys } from "@/features/products/queries/product.keys";
import { getAdminReviewsApi } from "@/features/reviews/api/reviews.api";
import { reviewKeys } from "@/features/reviews/queries/reviews.keys";
import {
	getAdminUserByIdApi,
	getAdminUsersApi,
} from "@/features/users/api/users.api";
import { userKeys } from "@/features/users/queries/user.keys";
import { queryOptions } from "@tanstack/react-query";
import { getDashboardStatsApi } from "../api/admin.api";
import { adminKeys } from "./admin.keys";

export function dashboardStatsQueryOptions() {
	return queryOptions({
		queryKey: adminKeys.stats(),
		queryFn: ({ signal }) => getDashboardStatsApi(signal),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}

export function adminProductsQueryOptions(params: PaginationParams) {
	return queryOptions({
		queryKey: productKeys.admin.list(params),
		queryFn: ({ signal }) => getAdminProductsApi(params, signal),
		staleTime: 2 * 60 * 1000,
	});
}

export function adminProductDetailQueryOptions(productId: string) {
	return queryOptions({
		queryKey: productKeys.admin.detail(productId),
		queryFn: ({ signal }) => getProductByIdApi(productId, signal),
		enabled: Boolean(productId),
	});
}

export function adminOrdersQueryOptions(
	params: PaginationParams & { status?: OrderStatus },
) {
	return queryOptions({
		queryKey: orderKeys.admin.list(params),
		queryFn: ({ signal }) => getAdminOrdersApi(params, signal),
		staleTime: 2 * 60 * 1000, // 2 minutes
	});
}

export function adminOrderDetailQueryOptions(orderId: string) {
	return queryOptions({
		queryKey: orderKeys.admin.detail(orderId),
		queryFn: ({ signal }) => getAdminOrderDetailApi(orderId, signal),
		enabled: Boolean(orderId),
	});
}

export function adminReviewsQueryOptions(params: PaginationParams) {
	return queryOptions({
		queryKey: reviewKeys.admin.list(params),
		queryFn: ({ signal }) => getAdminReviewsApi(params, signal),
		staleTime: 2 * 60 * 1000, // 2 minutes
	});
}

export function adminUsersQueryOptions(params: PaginationParams) {
	return queryOptions({
		queryKey: userKeys.admin.list(params),
		queryFn: ({ signal }) => getAdminUsersApi(params, signal),
		staleTime: 2 * 60 * 1000, // 2 minutes
	});
}

export function adminUserDetailQueryOptions(userId: string) {
	return queryOptions({
		queryKey: userKeys.admin.detail(userId),
		queryFn: ({ signal }) => getAdminUserByIdApi(userId, signal),
		enabled: Boolean(userId),
	});
}
