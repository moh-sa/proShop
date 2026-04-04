import type { z } from "zod";

import type {
	insertReviewSchema,
	selectReviewSchema,
} from "../schemas/index.js";
import type {
	reviewByProductIdPaginationFiltersSchema,
	reviewByUserIdPaginationFiltersSchema,
	reviewPaginationFiltersSchema,
	reviewPaginationSortSchema,
} from "../schemas/review/review-pagination.schema.js";
import type { PaginationFilter } from "./pagination.type.js";

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ReviewSchema = SelectReview;
export type SelectReview = z.infer<typeof selectReviewSchema>;

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

export type ReviewSort = z.infer<typeof reviewPaginationSortSchema>;
