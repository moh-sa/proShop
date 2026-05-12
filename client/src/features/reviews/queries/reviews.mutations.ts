import { buildPaginationMeta, type ApiPaginatedResponse } from "@/shared/api";
import { mutationOptions, type InfiniteData } from "@tanstack/react-query";
import { createReviewApi } from "../api";
import { REVIEWS_PAGE_SIZE } from "../consts";
import type { Review } from "../types";
import { reviewKeys } from "./reviews.keys";

export const createReviewMutationOptions = mutationOptions({
	mutationFn: createReviewApi,

	// ON MUTATE
	async onMutate(vars, ctx) {
		const optimisticId = `optimistic:${crypto.randomUUID()}`;
		const now = new Date();

		const optimisticReview: Review = {
			...vars,
			id: optimisticId,
			createdAt: now,
			updatedAt: now,
		};

		// cancel any queries related to reviews
		await Promise.all([
			ctx.client.cancelQueries({
				queryKey: reviewKeys.listByProduct(vars.productId),
			}),
			ctx.client.cancelQueries({
				queryKey: reviewKeys.existsUserProduct(vars.user.id, vars.productId),
			}),
		]);

		// snapshot the previous data
		const previousReviews = ctx.client.getQueryData<
			InfiniteData<ApiPaginatedResponse<Review>>
		>(reviewKeys.listByProduct(vars.productId));
		const previousExists = ctx.client.getQueryData<boolean>(
			reviewKeys.existsUserProduct(vars.user.id, vars.productId),
		);

		// update the cache with the optimistic data
		ctx.client.setQueryData<boolean>(
			reviewKeys.existsUserProduct(vars.user.id, vars.productId),
			true,
		);

		ctx.client.setQueryData<InfiniteData<ApiPaginatedResponse<Review>>>(
			reviewKeys.listByProduct(vars.productId),
			(old) => buildOptimisticInfiniteData(old, optimisticReview),
		);

		// return the snapshot so onError can rollback if mutation fails
		return {
			previousReviews,
			previousExists,
			optimisticId,
		};
	},

	// ON ERROR
	onError(_err, vars, rollback, ctx) {
		// rollback the cache to the previous state
		if (rollback?.previousReviews !== undefined) {
			ctx.client.setQueryData(
				reviewKeys.listByProduct(vars.productId),
				rollback.previousReviews,
			);
		}

		if (rollback?.previousExists !== undefined) {
			ctx.client.setQueryData(
				reviewKeys.existsUserProduct(vars.user.id, vars.productId),
				rollback.previousExists,
			);
		}
	},

	// ON SUCCESS
	onSuccess(createdReview, vars, rollback, ctx) {
		// update the cache with the actual server data
		ctx.client.setQueryData<InfiniteData<ApiPaginatedResponse<Review>>>(
			reviewKeys.listByProduct(vars.productId),
			(old) =>
				replaceOptimisticReview(old, rollback.optimisticId, createdReview),
		);
	},
});

function buildOptimisticInfiniteData(
	old: InfiniteData<ApiPaginatedResponse<Review>> | undefined,
	optimisticReview: Review,
): InfiniteData<ApiPaginatedResponse<Review>> {
	if (!old) {
		return {
			pageParams: [1],
			pages: [
				{
					data: [optimisticReview],
					meta: buildPaginationMeta({
						currentPage: 1,
						pageSize: REVIEWS_PAGE_SIZE,
						totalItems: 1,
					}),
				},
			],
		};
	}

	const { pageSize, totalItems } = old.pages[0].meta;
	return {
		...old,
		pages: old.pages.map((page, index) => ({
			...page,
			data: index === 0 ? [optimisticReview, ...page.data] : page.data,
			meta: buildPaginationMeta({
				currentPage: page.meta.currentPage,
				pageSize,
				totalItems: totalItems + 1,
			}),
		})),
	};
}

function replaceOptimisticReview(
	old: InfiniteData<ApiPaginatedResponse<Review>> | undefined,
	optimisticId: string,
	createdReview: Review,
): InfiniteData<ApiPaginatedResponse<Review>> | undefined {
	if (!old) return old;
	return {
		...old,
		pages: old.pages.map((page, index) =>
			index !== 0
				? page
				: {
						...page,
						data: page.data.map((r) =>
							r.id === optimisticId ? createdReview : r,
						),
					},
		),
	};
}
