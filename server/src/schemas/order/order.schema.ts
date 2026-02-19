import { z } from "zod";

import { objectIdValidator } from "../../validators/index.js";
import { paymentResultSchema } from "../payment/payment-result.schema.js";
import { shippingAddressSchema } from "../shipping/shipping-address.schema.js";
import { selectUserSchema } from "../user/user.schema.js";
import { insertOrderItemSchema } from "./order-item.schema.js";

export const orderStatusSchema = z.enum([
	"pending",
	"processing",
	"delivered",
	"cancelled",
]);

const baseOrderSchema = z.object({
	deliveredAt: z.date().optional(),

	itemsPrice: z
		.number()
		.min(0, { message: "Items price is required." })
		.default(0),
	orderItems: z.array(insertOrderItemSchema).min(1, {
		message: "Order items are required.",
	}),

	paidAt: z.date().optional(),
	paymentMethod: z.enum(["Stripe"]).default("Stripe"),
	paymentResult: paymentResultSchema,
	shippingAddress: shippingAddressSchema,

	shippingPrice: z
		.number()
		.min(0, { message: "Shipping price is required." })
		.default(0),
	status: orderStatusSchema.default("pending"),
	taxPrice: z.number().min(0, { message: "Tax price is required." }).default(0),

	totalPrice: z
		.number()
		.min(0, { message: "Total price is required." })
		.default(0),

	user: selectUserSchema.pick({ _id: true, email: true, name: true }),
});

export const insertOrderSchema = baseOrderSchema;

export const selectOrderSchema = baseOrderSchema.extend({
	_id: objectIdValidator,
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const allOrdersResponseSchema = selectOrderSchema.pick({
	_id: true,
	createdAt: true,
	deliveredAt: true,
	paidAt: true,
	status: true,
	totalPrice: true,
	user: true,
});
