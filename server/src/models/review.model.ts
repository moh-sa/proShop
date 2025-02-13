import { model, Schema } from "mongoose";
import { ReviewSchema } from "../types";

const reviewSchema = new Schema<ReviewSchema>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Review = model("Review", reviewSchema);
export default Review;
