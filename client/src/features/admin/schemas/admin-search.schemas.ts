import { orderStatusSchema } from "@/features/orders/schemas";
import { paginationParamsSchema } from "@/features/pagination";
import { z } from "zod";

/** Used by the products, users, and reviews list routes. */
export const adminPaginatedSearchSchema = paginationParamsSchema;

/** Used by the orders list route (adds an optional status filter). */
export const adminOrdersSearchSchema = paginationParamsSchema.extend({
	status: orderStatusSchema.optional(),
});

export type AdminPaginatedSearch = z.infer<typeof adminPaginatedSearchSchema>;
export type AdminOrdersSearch = z.infer<typeof adminOrdersSearchSchema>;
