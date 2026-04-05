import type { Types } from "mongoose";

import { model, Schema } from "mongoose";

import type { ReviewSchema } from "../types/index.js";

import { ProductModel } from "./product.model.js";

const reviewSchema = new Schema<ReviewSchema>(
	{
		comment: {
			required: true,
			type: String,
		},
		name: {
			required: true,
			type: String,
		},
		product: {
			ref: "Product",
			required: true,
			type: Schema.Types.ObjectId,
		},
		rating: {
			required: true,
			type: Number,
		},
		user: {
			ref: "User",
			required: true,
			type: Schema.Types.ObjectId,
		},
	},
	{
		timestamps: true,
	},
);

// Compound index to ensure ONE review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Update product 'rating' and 'numReviews' after review is saved or updated
async function updateProductRating(productId: Types.ObjectId) {
	const newStats = await ReviewModel.aggregate([
		{ $match: { product: productId } },
		{
			$group: {
				_id: "$product",
				numReviews: { $sum: 1 },
				rating: { $avg: "$rating" },
			},
		},
	]);

	await ProductModel.findByIdAndUpdate(productId, {
		numReviews: newStats.length > 0 ? newStats[0].numReviews : 0,
		rating: newStats.length > 0 ? newStats[0].rating.toFixed(1) : 0,
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

export const ReviewModel = model("Review", reviewSchema);
