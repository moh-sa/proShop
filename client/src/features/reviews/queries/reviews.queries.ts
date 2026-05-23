import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
	getProductReviewsApi,
	getUserReviewsCountApi,
	hasReviewedProductApi,
} from "../api";
import { REVIEWS_PAGE_SIZE } from "../consts";
import { reviewKeys } from "./reviews.keys";

export function hasReviewedProductQueryOptions(
	userId: string | undefined,
	productId: string,
) {
	return queryOptions({
		queryKey: reviewKeys.existsUserProduct(userId ?? "", productId),
		queryFn: ({ signal }) =>
			hasReviewedProductApi(productId, userId ?? "", signal),
		refetchOnWindowFocus: false,
		enabled: Boolean(userId) && Boolean(productId),
		retry: false,
		staleTime: 30 * 60 * 1000, // 30 minutes
	});
}

export function productReviewsListQueryOptions(productId: string) {
	return infiniteQueryOptions({
		queryKey: reviewKeys.listByProduct(productId),
		queryFn: ({ pageParam, signal }) =>
			getProductReviewsApi(
				productId,
				{ pageNumber: pageParam, pageSize: REVIEWS_PAGE_SIZE },
				signal,
			),
		getNextPageParam: (lastPage) => {
			return lastPage.meta.hasNextPage
				? lastPage.meta.currentPage + 1
				: undefined;
		},
		initialPageParam: 1,
		refetchOnWindowFocus: false,
		enabled: Boolean(productId),
		staleTime: 10 * 60 * 1000, // 10 minutes
	});
}

export function countUserReviewsQueryOptions(userId: string) {
	return queryOptions({
		queryKey: reviewKeys.countUser(userId),
		queryFn: ({ signal }) => getUserReviewsCountApi(userId, signal),
		refetchOnWindowFocus: false,
		enabled: Boolean(userId),
	});
}
