import type { PaginationParams } from "@/features/pagination";
import { queryOptions } from "@tanstack/react-query";
import { productPaginatedListApi, productTopRatedListApi } from "../api";
import { productKeys } from "./product.keys";

export const productTopRatedListQueryOptions = queryOptions({
	queryKey: productKeys.topRated(),
	queryFn: ({ signal }) => productTopRatedListApi(signal),
	refetchOnWindowFocus: false,
});

export function productPaginatedListQueryOptions(params: PaginationParams) {
	return queryOptions({
		queryKey: productKeys.list(params),
		queryFn: ({ signal }) => productPaginatedListApi(params, signal),
		refetchOnWindowFocus: false,
	});
}
