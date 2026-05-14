import { authKeys } from "@/features/auth";
import type { User } from "@/features/users";
import { buildPaginationMeta, type ApiPaginatedResponse } from "@/shared/api";
import { mutationOptions, type InfiniteData } from "@tanstack/react-query";
import { createReviewApi, deleteReviewApi, updateReviewApi } from "../api";
import { REVIEWS_PAGE_SIZE } from "../consts";
import type {
	DeleteReviewMutationInput,
	Review,
	UpdateReviewMutationInput,
} from "../types";
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

export const updateReviewMutationOptions = mutationOptions({
	mutationFn: (input: UpdateReviewMutationInput) =>
		updateReviewApi({
			reviewId: input.reviewId,
			rating: input.rating,
			comment: input.comment,
		}),

	// ON MUTATE
	async onMutate(vars, ctx) {
		// cancel query related to the review being updated
		await ctx.client.cancelQueries({
			queryKey: reviewKeys.listByProduct(vars.productId),
		});

		// snapshot the previous data
		const previousReviews = ctx.client.getQueryData<
			InfiniteData<ApiPaginatedResponse<Review>>
		>(reviewKeys.listByProduct(vars.productId));

		// update the cache with the optimistic data
		ctx.client.setQueryData<InfiniteData<ApiPaginatedResponse<Review>>>(
			reviewKeys.listByProduct(vars.productId),
			(old) => applyOptimisticUpdate(old, vars),
		);

		// return the snapshot so onError can rollback if mutation fails
		return { previousReviews };
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
	},

	// ON SUCCESS
	onSuccess(updatedReview, vars, _rollback, ctx) {
		// update the cache with the real data returned from the server
		ctx.client.setQueryData<InfiniteData<ApiPaginatedResponse<Review>>>(
			reviewKeys.listByProduct(vars.productId),
			(old) => replaceReview(old, updatedReview),
		);
	},
});

export const deleteReviewMutationOptions = mutationOptions({
	mutationFn: (input: DeleteReviewMutationInput) =>
		deleteReviewApi(input.reviewId),

	// ON MUTATE
	async onMutate(vars, ctx) {
		// cancel queries related to the review being deleted
		await Promise.all([
			ctx.client.cancelQueries({
				queryKey: reviewKeys.listByProduct(vars.productId),
			}),
			ctx.client.cancelQueries({
				queryKey: reviewKeys.existsUserProduct(vars.userId, vars.productId),
			}),
		]);

		// snapshot the previous data
		const previousReviews = ctx.client.getQueryData<
			InfiniteData<ApiPaginatedResponse<Review>>
		>(reviewKeys.listByProduct(vars.productId));

		const authUser = ctx.client.getQueryData<User>(authKeys.me());
		const isAuthor = vars.userId === authUser?.id;
		let previousExists: boolean | undefined;
		if (isAuthor) {
			previousExists = ctx.client.getQueryData<boolean>(
				reviewKeys.existsUserProduct(vars.userId, vars.productId),
			);
		}

		// optimistically remove the review from the cache
		ctx.client.setQueryData<InfiniteData<ApiPaginatedResponse<Review>>>(
			reviewKeys.listByProduct(vars.productId),
			(old) => removeReviewFromCache(old, vars.reviewId),
		);

		if (isAuthor) {
			ctx.client.setQueryData<boolean>(
				reviewKeys.existsUserProduct(vars.userId, vars.productId),
				false,
			);
		}

		// return the snapshot so onError can rollback if mutation fails
		return { previousReviews, previousExists };
	},

	// ON ERROR
	onError(_err, vars, rollback, ctx) {
		const authUser = ctx.client.getQueryData<User>(authKeys.me());
		const isAuthor = vars.userId === authUser?.id;

		if (rollback?.previousReviews !== undefined) {
			ctx.client.setQueryData(
				reviewKeys.listByProduct(vars.productId),
				rollback.previousReviews,
			);
		}

		if (isAuthor && rollback?.previousExists !== undefined) {
			ctx.client.setQueryData(
				reviewKeys.existsUserProduct(vars.userId, vars.productId),
				rollback.previousExists,
			);
		}
	},

	onSuccess(_data, vars, _rollback, ctx) {
		ctx.client.invalidateQueries({
			queryKey: reviewKeys.listByProduct(vars.productId),
		});
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

function applyOptimisticUpdate(
	old: InfiniteData<ApiPaginatedResponse<Review>> | undefined,
	vars: UpdateReviewMutationInput,
): InfiniteData<ApiPaginatedResponse<Review>> | undefined {
	if (!old) return old;
	return {
		...old,
		pages: old.pages.map((page) => ({
			...page,
			data: page.data.map((r) =>
				r.id === vars.reviewId
					? {
							...r,
							...(vars.rating !== undefined && { rating: vars.rating }),
							...(vars.comment !== undefined && { comment: vars.comment }),
							updatedAt: new Date(),
						}
					: r,
			),
		})),
	};
}

function replaceReview(
	old: InfiniteData<ApiPaginatedResponse<Review>> | undefined,
	updatedReview: Review,
): InfiniteData<ApiPaginatedResponse<Review>> | undefined {
	if (!old) return old;
	return {
		...old,
		pages: old.pages.map((page) => ({
			...page,
			data: page.data.map((r) =>
				r.id === updatedReview.id ? updatedReview : r,
			),
		})),
	};
}

function removeReviewFromCache(
	old: InfiniteData<ApiPaginatedResponse<Review>> | undefined,
	reviewId: string,
): InfiniteData<ApiPaginatedResponse<Review>> | undefined {
	if (!old) return old;
	const totalItems = old.pages[0]?.meta.totalItems ?? 0;
	return {
		...old,
		pages: old.pages.map((page) => ({
			...page,
			data: page.data.filter((r) => r.id !== reviewId),
			meta: buildPaginationMeta({
				currentPage: page.meta.currentPage,
				pageSize: page.meta.pageSize,
				totalItems: Math.max(0, totalItems - 1),
			}),
		})),
	};
}
