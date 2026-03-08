import { z } from "zod";

import { objectIdValidator } from "../../validators/index.js";
import { paymentProviderSchema } from "../payment/payment.schema.js";
import { shippingAddressSchema } from "../shipping/shipping-address.schema.js";
import { selectUserSchema } from "../user/user.schema.js";
import { insertOrderItemSchema } from "./order-item.schema.js";

export const orderStatusSchema = z.enum([
	"pending",
	"processing",
	"delivered",
	"cancelled",
]);

export const paymentSchema = z.object({
	id: z.string().min(1, { error: "payment ID is required." }),
	paidAt: z.coerce.date(),
	provider: paymentProviderSchema,
	sessionURL: z.url({ error: "Invalid checkout session URL." }),
});

const baseOrderSchema = z.object({
	deliveredAt: z.date().optional(),

	itemsPrice: z
		.number()
		.min(0, { error: "Items price is required." })
		.default(0),
	orderItems: z.array(insertOrderItemSchema).min(1, {
		error: "Order items are required.",
	}),

	payment: paymentSchema.optional(),
	shippingAddress: shippingAddressSchema,

	shippingPrice: z
		.number()
		.min(0, { error: "Shipping price is required." })
		.default(0),
	status: orderStatusSchema.default("pending"),
	taxPrice: z.number().min(0, { error: "Tax price is required." }).default(0),

	totalPrice: z
		.number()
		.min(0, { error: "Total price is required." })
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
	payment: true,
	status: true,
	totalPrice: true,
	user: true,
});

export const markAsBaseParamsSchema = z.object({
	orderId: objectIdValidator.transform((id) => id.toString()),
});

export const markAsProcessingParamsSchema = markAsBaseParamsSchema.extend({
	paidAt: z.date(),
});

export const markAsCancelledParamsSchema = markAsBaseParamsSchema;
