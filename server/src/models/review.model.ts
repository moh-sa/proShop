import { model, Schema } from "mongoose";
import { ReviewSchema } from "../types";

const reviewSchema = new Schema<ReviewSchema>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: [true, "User reference is required"],
      ref: "User",
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      required: [true, "Product reference is required"],
      ref: "Product",
      index: true,
    },
    name: {
      type: String,
      required: [true, "Reviewer name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters long"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

const Review = model<ReviewSchema>("User", reviewSchema);

export default Review;
