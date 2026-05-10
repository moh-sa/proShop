import type { PaginationParams } from "@/features/pagination";
import { queryOptions } from "@tanstack/react-query";
import {
	getProductByIdApi,
	productPaginatedListApi,
	productSearchListApi,
	productTopRatedListApi,
} from "../api";
import type { ProductSearchParams } from "../types";
import { productKeys } from "./product.keys";

export const productTopRatedListQueryOptions = queryOptions({
	queryKey: productKeys.topRated(),
	queryFn: ({ signal }) => productTopRatedListApi(signal),
	refetchOnWindowFocus: false,
});

export function productPaginatedListQueryOptions(params: PaginationParams) {
	return queryOptions({
		queryKey: productKeys.home(params),
		queryFn: ({ signal }) => productPaginatedListApi(params, signal),
		refetchOnWindowFocus: false,
	});
}

export function productSearchListQueryOptions(params: ProductSearchParams) {
	return queryOptions({
		queryKey: productKeys.search(params),
		queryFn: ({ signal }) => productSearchListApi(params, signal),
		refetchOnWindowFocus: false,
	});
}

export function productDetailQueryOptions(productId: string) {
	return queryOptions({
		queryKey: productKeys.detail(productId),
		queryFn: ({ signal }) => getProductByIdApi(productId, signal),
		refetchOnWindowFocus: false,
		enabled: Boolean(productId),
	});
}
