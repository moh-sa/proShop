import type { z } from "zod";

import type {
	insertReviewSchema,
	selectReviewSchema,
} from "../schemas/index.js";

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ReviewSchema = SelectReview;
export type SelectReview = z.infer<typeof selectReviewSchema>;
