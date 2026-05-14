import {
	paginationParamsSchema,
	type PaginationParams,
} from "@/features/pagination";
import {
	buildSearchParams,
	ClientApiError,
	del,
	get,
	getPaginated,
	normalizeError,
	patch,
	post,
	type ApiPaginatedResponse,
} from "@/shared/api";
import { idSchema } from "@/shared/schemas";
import z from "zod";
import {
	createReviewSchema,
	reviewSchema,
	updateReviewApiInputSchema,
} from "../schemas";
import type { CreateReview, Review, UpdateReviewApiInput } from "../types";

export function createReviewApi(input: CreateReview): Promise<Review> {
	const parsedInput = createReviewSchema.safeParse(input);
	if (!parsedInput.success) {
		throw new ClientApiError(normalizeError(parsedInput.error, "input"));
	}

	return post(`/reviews`, parsedInput.data, reviewSchema);
}

export function hasReviewedProductApi(
	productId: string,
	userId: string,
	signal: AbortSignal,
): Promise<boolean> {
	const parsedInput = z
		.object({
			productId: idSchema,
			userId: idSchema,
		})
		.safeParse({ productId, userId });
	if (!parsedInput.success) {
		throw new ClientApiError(normalizeError(parsedInput.error, "input"));
	}

	return get(
		`/reviews/exists/user/${parsedInput.data.userId}/product/${parsedInput.data.productId}`,
		z.boolean(),
		signal,
	);
}

export function updateReviewApi(input: UpdateReviewApiInput): Promise<Review> {
	const parsedInput = updateReviewApiInputSchema.safeParse(input);
	if (!parsedInput.success) {
		throw new ClientApiError(normalizeError(parsedInput.error, "input"));
	}

	const { reviewId, ...body } = parsedInput.data;
	return patch(`/reviews/${reviewId}`, body, reviewSchema);
}

export function deleteReviewApi(reviewId: string): Promise<void> {
	const parsedId = idSchema.safeParse(reviewId);
	if (!parsedId.success) {
		throw new ClientApiError(normalizeError(parsedId.error, "input"));
	}

	return del(`/reviews/${parsedId.data}`);
}

export function getProductReviewsApi(
	productId: string,
	params: PaginationParams,
	signal: AbortSignal,
): Promise<ApiPaginatedResponse<Review>> {
	const parsedProductId = idSchema.safeParse(productId);
	if (!parsedProductId.success) {
		throw new ClientApiError(normalizeError(parsedProductId.error, "input"));
	}

	const parsedParams = paginationParamsSchema
		.transform(buildSearchParams)
		.safeParse(params);
	if (!parsedParams.success) {
		throw new ClientApiError(normalizeError(parsedParams.error, "input"));
	}

	return getPaginated(
		`/reviews/product/${parsedProductId.data}?${parsedParams.data}`,
		reviewSchema,
		signal,
	);
}
