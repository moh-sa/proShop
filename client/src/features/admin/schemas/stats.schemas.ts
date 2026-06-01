import { baseOrderSchema, orderStatusSchema } from "@/features/orders/schemas";
import { productSchema } from "@/features/products";
import { z } from "zod";

export const statCountsSchema = z.object({
	orders: z.number(),
	products: z.number(),
	revenue: z.number(),
	users: z.number(),
});

export const revenueByMonthSchema = z.object({
	month: z.string(),
	revenue: z.number(),
});

export const dashboardRecentOrderSchema = baseOrderSchema.pick({
		id: true,
		createdAt: true,
		totalPrice: true,
		user: true,
	})
	.extend({
		status: orderStatusSchema,
	});

export const lowStockProductSchema = productSchema.pick({
	id: true,
	name: true,
	image: true,
	countInStock: true,
});

export const dashboardStatsSchema = z.object({
	counts: statCountsSchema,
	revenueByMonth: z.array(revenueByMonthSchema),
	recentOrders: z.array(dashboardRecentOrderSchema),
	lowStockProducts: z.array(lowStockProductSchema),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type DashboardRecentOrder = z.infer<typeof dashboardRecentOrderSchema>;
export type LowStockProduct = z.infer<typeof lowStockProductSchema>;
export type RevenueByMonthItem = z.infer<typeof revenueByMonthSchema>;
