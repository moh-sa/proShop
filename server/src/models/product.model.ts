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

const Product = model<ProductSchema>("Product", productSchema);

export default Product;
