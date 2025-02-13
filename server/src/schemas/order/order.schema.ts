import { z } from "zod";
import { objectIdValidator } from "../../validators";
import { paymentResultSchema } from "../payment/payment-result.schema";
import { shippingAddressSchema } from "../shipping/shipping-address.schema";
import {
  insertOrderItemSchema,
  selectOrderItemSchema,
} from "./order-item.schema";

const baseOrderSchema = z.object({
  user: objectIdValidator,

  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["PayPal", "Stripe"]).default("PayPal"),
  paymentResult: paymentResultSchema,
  itemsPrice: z
    .number()
    .min(0, { message: "Items price is required." })
    .default(0),
  shippingPrice: z
    .number()
    .min(0, { message: "Shipping price is required." })
    .default(0),
  taxPrice: z.number().min(0, { message: "Tax price is required." }).default(0),
  totalPrice: z
    .number()
    .min(0, { message: "Total price is required." })
    .default(0),
  isPaid: z.boolean().default(false),
  paidAt: z.date().optional(),
  isDelivered: z.boolean().default(false),
  deliveredAt: z.date().optional(),
});

export const insertOrderSchema = baseOrderSchema.extend({
  orderItems: z.array(insertOrderItemSchema),
});

export const selectOrderSchema = baseOrderSchema.extend({
  _id: objectIdValidator,
  createdAt: z.date(),
  updatedAt: z.date(),
  orderItems: z.array(selectOrderItemSchema),
});
