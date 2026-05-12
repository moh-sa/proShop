import type z from "zod";
import type {
	createReviewInputSchema,
	createReviewSchema,
	reviewSchema,
} from "../schemas";

export type CreateReview = z.infer<typeof createReviewSchema>;
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type Review = z.infer<typeof reviewSchema>;
