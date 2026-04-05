import mongoose, { model, Schema } from "mongoose";

import type { ProductSchema } from "../types/index.js";

const productSchema = new Schema<ProductSchema>(
	{
		brand: {
			required: true,
			type: String,
		},
		category: {
			required: true,
			type: String,
		},
		countInStock: {
			default: 0,
			required: true,
			type: Number,
		},
		description: {
			required: true,
			type: String,
		},
		image: {
			required: true,
			type: String,
		},
		name: {
			required: true,
			type: String,
		},
		numReviews: {
			default: 0,
			required: true,
			type: Number,
		},
		price: {
			default: 0,
			required: true,
			type: Number,
		},
		rating: {
			default: 0,
			required: true,
			type: Number,
		},
		user: {
			ref: "User",
			required: true,
			type: mongoose.Schema.Types.ObjectId,
		},
	},
	{
		timestamps: true,
	},
);

// Indexes
productSchema.index(
	{
		brand: "text",
		category: "text",
		description: "text",
		name: "text",
	},
	{
		name: "product_text_search",
		weights: {
			brand: 5,
			category: 3,
			description: 2,
			name: 10,
		},
	},
);

productSchema.index({ createdAt: -1 }, { name: "product_created_desc" });
productSchema.index({ rating: -1 }, { name: "product_rating_desc" });

// Model
export const ProductModel = model<ProductSchema>("Product", productSchema);
