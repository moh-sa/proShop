import type { z } from "zod";

import type {
	insertReviewSchema,
	selectReviewSchema,
} from "../schemas/index.js";
import type { PaginationParamsString } from "./pagination.type.js";

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ReviewSchema = SelectReview;
export type SelectReview = z.infer<typeof selectReviewSchema>;

// Pagination
export type ReviewPaginationParamsByProductId = PaginationParamsString & {
	productId: string;
};

export type ReviewPaginationParamsByUserId = PaginationParamsString & {
	userId: string;
};
