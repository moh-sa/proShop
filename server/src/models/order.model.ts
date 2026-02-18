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
		paidAt: {
			type: Date,
		},
		paymentMethod: {
			required: true,
			type: String,
		},
		paymentResult: {
			email_address: { type: String },
			id: { type: String },
			status: { type: String },
			update_time: { type: String },
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
			ref: "User",
			required: true,
			type: mongoose.Schema.Types.ObjectId,
		},
	},
	{
		timestamps: true,
	},
);

const Order = model<OrderSchema>("Order", orderSchema);

export default Order;
