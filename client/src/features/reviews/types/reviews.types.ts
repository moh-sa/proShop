import type z from "zod";
import type {
	createReviewInputSchema,
	createReviewSchema,
	deleteReviewMutationInputSchema,
	reviewSchema,
	updateReviewApiInputSchema,
	updateReviewInputSchema,
	updateReviewMutationInputSchema,
} from "../schemas";

export type CreateReview = z.infer<typeof createReviewSchema>;
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type UpdateReviewApiInput = z.infer<typeof updateReviewApiInputSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;
export type UpdateReviewMutationInput = z.infer<
	typeof updateReviewMutationInputSchema
>;
export type DeleteReviewMutationInput = z.infer<
	typeof deleteReviewMutationInputSchema
>;
