import { shippingAddressSchema } from "@/features/checkout/schemas";
import { userSchema } from "@/features/users";
import { selectSchema } from "@/shared/schemas";
import { z } from "zod";

const paymentProviderSchema = z.enum(["stripe"]);

const paymentSchema = z.object({
	id: z.string().nonempty("Payment ID is required"),
	paidAt: z.coerce.date(),
	provider: paymentProviderSchema,
	sessionURL: z.url(),
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
});

export const orderProcessingSchema = baseOrderSchema.extend({
	status: z.literal("processing"),
	payment: paymentSchema,
});

export const orderDeliveredSchema = baseOrderSchema.extend({
	status: z.literal("delivered"),
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
