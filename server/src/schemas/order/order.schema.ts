import { z } from "zod";

import {
	nonEmptyStringValidator,
	objectIdStringValidator,
	objectIdValidator,
	urlValidator,
} from "../../validators/index.js";
import { paymentProviderSchema } from "../payment/payment.schema.js";
import { shippingAddressSchema } from "../shipping/shipping-address.schema.js";
import { userModelSchema, userSchema } from "../user/user.schema.js";
import { createOrderItemSchema } from "./order-item.schema.js";

export const orderStatusSchema = z.enum([
	"pending",
	"processing",
	"delivered",
	"cancelled",
]);

export const paymentSchema = z.object({
	id: nonEmptyStringValidator("payment ID"),
	paidAt: z.coerce.date(),
	provider: paymentProviderSchema,
	sessionURL: urlValidator,
});

const baseSchema = z.object({
	deliveredAt: z.date().optional(),

	itemsPrice: z.number().min(0, { error: "Items price is required." }),
	orderItems: z.array(createOrderItemSchema).min(1, {
		error: "Order items are required.",
	}),

	payment: paymentSchema.optional(),
	shippingAddress: shippingAddressSchema,

	shippingPrice: z.number().min(0, { error: "Shipping price is required." }),
	status: orderStatusSchema.default("pending"),
	taxPrice: z.number().min(0, { error: "Tax price is required." }),

	totalPrice: z.number().min(0, { error: "Total price is required." }),
	user: userSchema.pick({ email: true, id: true, name: true }),
});

export const createOrderSchema = baseSchema;

export const orderSchema = baseSchema.extend({
	createdAt: z.date(),
	id: objectIdStringValidator,
	updatedAt: z.date(),
});

export const orderModelSchema = orderSchema.extend({
	_id: objectIdValidator,
	user: userModelSchema.pick({ email: true, id: true, name: true }),
});

export const allOrdersResponseSchema = orderSchema.pick({
	createdAt: true,
	deliveredAt: true,
	id: true,
	payment: true,
	status: true,
	totalPrice: true,
	user: true,
});

export const markAsBaseParamsSchema = z.object({
	orderId: objectIdStringValidator,
});

export const markAsProcessingParamsSchema = markAsBaseParamsSchema.extend({
	paidAt: z.date(),
});

export const markAsCancelledParamsSchema = markAsBaseParamsSchema;
