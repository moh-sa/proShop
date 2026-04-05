import type { z } from "zod";

import type { createReviewSchema, reviewSchema } from "../schemas/index.js";
import type {
	reviewByProductIdPaginationFiltersSchema,
	reviewByProductIdPaginationParamsSchema,
	reviewByUserIdPaginationFiltersSchema,
	reviewByUserIdPaginationParamsSchema,
	reviewPaginationFiltersSchema,
	reviewPaginationParamsSchema,
	reviewPaginationSortSchema,
} from "../schemas/review/review-pagination.schema.js";
import type {
	PaginationFilter,
	PaginationParamsStringified,
	PaginationSelect,
} from "./pagination.type.js";
import type { Stringify } from "./stringify.type.js";

export type CreateReview = z.infer<typeof createReviewSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type ReviewSchema = Review;

// Pagination
export type ReviewByProductIdFilter = PaginationFilter<
	z.infer<typeof reviewByProductIdPaginationFiltersSchema>
>;

export type ReviewByUserIdFilter = PaginationFilter<
	z.infer<typeof reviewByUserIdPaginationFiltersSchema>
>;

export type ReviewFilter = PaginationFilter<
	z.infer<typeof reviewPaginationFiltersSchema>
>;

export type ReviewSelect = PaginationSelect<Review>;

export type ReviewSort = z.infer<typeof reviewPaginationSortSchema>;

// Method Params
export type GetAllReviewsByProductIdRepositoryParams = z.infer<
	typeof reviewByProductIdPaginationParamsSchema
> & {
	select?: ReviewSelect;
};

export type GetAllReviewsByUserIdRepositoryParams = z.infer<
	typeof reviewByUserIdPaginationParamsSchema
> & {
	select?: ReviewSelect;
};

export type GetAllReviewsRepositoryParams = z.infer<
	typeof reviewPaginationParamsSchema
> & {
	select?: ReviewSelect;
};

// Service Params
export type GetAllReviewsByProductIdServiceParams =
	PaginationParamsStringified & {
		filters?: Stringify<ReviewByProductIdFilter>;
		productId: string;
		sort?: string;
	};

export type GetAllReviewsByUserIdServiceParams = PaginationParamsStringified & {
	filters?: Stringify<ReviewByUserIdFilter>;
	sort?: string;
	userId: string;
};

export type GetAllReviewsServiceParams = PaginationParamsStringified & {
	filters?: Stringify<ReviewFilter>;
	sort?: string;
};

// Controller Params
export type GetAllReviewsByProductIdControllerParams =
	GetAllReviewsControllerParams;

export type GetAllReviewsByUserIdControllerParams =
	GetAllReviewsControllerParams;

export type GetAllReviewsControllerParams = PaginationParamsStringified & {
	productId?: string;
	sort?: string;
	userId?: string;
};
