import type z from "zod";

import type {
	lowStockProductSchema,
	recentOrderSchema,
	revenueByMonthItemSchema,
	statsCountsSchema,
	statsResponseSchema,
} from "../schemas/stats/stats.schema.js";

export type StatsCounts = z.infer<typeof statsCountsSchema>;
export type RevenueByMonthItem = z.infer<typeof revenueByMonthItemSchema>;
export type LowStockProduct = z.infer<typeof lowStockProductSchema>;
export type RecentOrder = z.infer<typeof recentOrderSchema>;
export type StatsResponse = z.infer<typeof statsResponseSchema>;
