import { z } from "zod";
import { objectIdValidator } from "../validators";
import { selectUserSchema } from "./user.type";

const baseReviewSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),

  rating: z.coerce
    .number()
    .positive({ message: "Rating must be a positive number." })
    .min(0, { message: "Rating is required." })
    .max(5, { message: "Rating must be between 1 and 5." }),

  comment: z.string().min(1, { message: "Comment is required." }),
});

export const insertReviewSchema = baseReviewSchema.extend({
  user: objectIdValidator,
});

export const selectReviewSchema = baseReviewSchema.extend({
  _id: objectIdValidator,
  user: selectUserSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type SelectReview = z.infer<typeof selectReviewSchema>;
export type ReviewSchema = SelectReview;
