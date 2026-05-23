import { shippingAddressSchema } from "@/features/checkout/schemas";
import { userSchema } from "@/features/users";
import { selectSchema } from "@/shared/schemas";
import { z } from "zod";

const paymentProviderSchema = z.enum(["stripe"]);

const pendingPaymentSchema = z.object({
	id: z.string().nonempty("Payment ID is required"),
	provider: paymentProviderSchema,
	sessionURL: z.url(),
});

const paymentSchema = pendingPaymentSchema.extend({
	paidAt: z.coerce.date(),
});

export const orderItemSchema = z.object({
	name: z.string().nonempty("Name is required"),
	price: z.number().positive("Price is required"),
	image: z.string().nonempty("Image is required"),
	productId: z.string().nonempty("Product ID is required"),
	qty: z.number().int().positive("Quantity is required"),
});

const baseSchema = z.object({
	orderItems: z.array(orderItemSchema).nonempty("Order items are required"),
	shippingAddress: shippingAddressSchema,
	itemsPrice: z.number().nonnegative("Items price is required"),
	shippingPrice: z.number().nonnegative("Shipping price is required"),
	taxPrice: z.number().nonnegative("Tax price is required"),
	totalPrice: z.number().nonnegative("Total price is required"),
});

export const createOrderSchema = baseSchema;

const baseOrderSchema = baseSchema.extend({
	...selectSchema.shape,
	user: userSchema.pick({ id: true, name: true, email: true }),
});

export const orderPendingSchema = baseOrderSchema.extend({
	status: z.literal("pending"),
	payment: pendingPaymentSchema,
});

export const orderProcessingSchema = baseOrderSchema.extend({
	status: z.literal("processing"),
	payment: paymentSchema,
});

export const orderDeliveredSchema = baseOrderSchema.extend({
	status: z.literal("delivered"),
	payment: paymentSchema,
	deliveredAt: z.coerce.date(),
});

export const orderCancelledSchema = baseOrderSchema.extend({
	status: z.literal("cancelled"),
});

export const orderSchema = z.discriminatedUnion("status", [
	orderPendingSchema,
	orderProcessingSchema,
	orderDeliveredSchema,
	orderCancelledSchema,
]);

const paymentSessionSchema = z.object({
	url: z.url().nonempty("Payment session URL is required"),
});

export const createOrderResponseSchema = z.object({
	order: orderPendingSchema,
	session: paymentSessionSchema,
});

export const orderListItemSchema = z.discriminatedUnion("status", [
	orderPendingSchema.pick({
		id: true,
		status: true,
		createdAt: true,
		totalPrice: true,
		user: true,
		payment: true,
	}),
	orderProcessingSchema.pick({
		id: true,
		status: true,
		payment: true,
		totalPrice: true,
		user: true,
		createdAt: true,
	}),
	orderDeliveredSchema.pick({
		id: true,
		status: true,
		payment: true,
		totalPrice: true,
		user: true,
		deliveredAt: true,
		createdAt: true,
	}),
	orderCancelledSchema.pick({
		id: true,
		status: true,
		totalPrice: true,
		user: true,
		createdAt: true,
	}),
]);
