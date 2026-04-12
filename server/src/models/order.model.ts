import mongoose, { model, Schema } from "mongoose";

import type { OrderSchema } from "../types/index.js";

const orderSchema = new Schema<OrderSchema>(
	{
		deliveredAt: {
			type: Date,
		},
		itemsPrice: {
			default: 0,
			required: true,
			type: Number,
		},
		orderItems: [
			{
				image: { required: true, type: String },
				name: { required: true, type: String },
				price: { required: true, type: Number },
				product: {
					ref: "Product",
					required: true,
					type: mongoose.Schema.Types.ObjectId,
				},
				qty: { required: true, type: Number },
			},
		],
		payment: {
			id: { type: String },
			paidAt: { type: Date },
			provider: {
				enum: ["stripe"],
				type: String,
			},
			sessionURL: { type: String },
		},
		shippingAddress: {
			address: { required: true, type: String },
			city: { required: true, type: String },
			country: { required: true, type: String },
			postalCode: { required: true, type: String },
		},
		shippingPrice: {
			default: 0,
			required: true,
			type: Number,
		},
		status: {
			default: "pending",
			enum: ["pending", "processing", "delivered", "cancelled"],
			required: true,
			type: String,
		},
		taxPrice: {
			default: 0,
			required: true,
			type: Number,
		},
		totalPrice: {
			default: 0,
			required: true,
			type: Number,
		},
		user: {
			email: {
				required: true,
				type: String,
			},
			id: {
				ref: "User",
				required: true,
				type: mongoose.Schema.Types.ObjectId,
			},
			name: {
				required: true,
				type: String,
			},
		},
	},
	{
		timestamps: true,
	},
);

export const OrderModel = model<OrderSchema>("Order", orderSchema);
