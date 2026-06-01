import { z } from "zod";

import { orderSchema } from "../order/order.schema.js";
import { productSchema } from "../product/product.schema.js";

export const statsCountsSchema = z.object({
	orders: z.number(),
	products: z.number(),
	revenue: z.number(),
	users: z.number(),
});

export const revenueByMonthItemSchema = z.object({
	month: z.string(),
	revenue: z.number(),
});

export const lowStockProductSchema = productSchema.pick({
	countInStock: true,
	id: true,
	image: true,
	name: true,
});

export const recentOrderSchema = orderSchema.pick({
	id: true,
	createdAt: true,
	status: true,
	totalPrice: true,
	user: true,
});
export const statsResponseSchema = z.object({
	counts: statsCountsSchema,
	lowStockProducts: z.array(lowStockProductSchema),
	recentOrders: z.array(recentOrderSchema),
	revenueByMonth: z.array(revenueByMonthItemSchema),
});
