import type { PaginationParams } from "@/features/pagination";

export const orderKeys = {
	all: ["orders"] as const,
	_lists: () => [...orderKeys.all, "list"] as const,
	byUserList: (userId: string, params: PaginationParams) =>
		[...orderKeys._lists(), "user", userId, params] as const,
	detail: (orderId: string) => [...orderKeys.all, "detail", orderId] as const,
} as const;
