import { z } from "zod";
import { insertReviewSchema, selectReviewSchema } from "../schemas";

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type SelectReview = z.infer<typeof selectReviewSchema>;
export type ReviewSchema = SelectReview;
