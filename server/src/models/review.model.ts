import { model, Schema, Types } from "mongoose";
import { ReviewSchema } from "../types";
import Product from "./productModel";

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

// Compound index to ensure ONE review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Update product 'rating' and 'numReviews' after review is saved or updated
async function updateProductRating(productId: Types.ObjectId) {
  const newStats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        rating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    rating: newStats.length > 0 ? newStats[0].rating.toFixed(1) : 0,
    numReviews: newStats.length > 0 ? newStats[0].numReviews : 0,
  });
}

reviewSchema.post("save", async function () {
  await updateProductRating(this.product);
});

reviewSchema.post(
  ["findOneAndUpdate", "findOneAndDelete"],
  async function (doc) {
    if (doc) {
      await updateProductRating(doc.product);
    }
  },
);

const Review = model("Review", reviewSchema);
export default Review;
