import type { z } from "zod";

import type {
	insertReviewSchema,
	selectReviewSchema,
} from "../schemas/index.js";
import type { reviewPaginationFiltersSchema } from "../schemas/review/review-pagination.schema.js";
import type { PaginationFilter } from "./pagination.type.js";

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ReviewSchema = SelectReview;
export type SelectReview = z.infer<typeof selectReviewSchema>;

// Pagination
export type ReviewFilter = PaginationFilter<
	z.infer<typeof reviewPaginationFiltersSchema>
>;
