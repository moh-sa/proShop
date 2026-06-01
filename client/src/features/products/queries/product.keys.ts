import type { PaginationParams } from "@/features/pagination";
import type { ProductSearchParams } from "../types";

export const productKeys = {
	all: ["products"] as const,
	_lists: () => [...productKeys.all, "list"] as const,
	home: (params: PaginationParams) =>
		[...productKeys._lists(), "home", params] as const,
	search: (params: ProductSearchParams) =>
		[...productKeys._lists(), "search", params] as const,
	topRated: () => [...productKeys._lists(), "top-rated"] as const,
	detail: (productId: string) =>
		[...productKeys.all, "detail", productId] as const,
	admin: {
		list: (params?: Record<string, unknown>) =>
			[...productKeys.all, "admin", "list", params] as const,
		detail: (productId: string) =>
			[...productKeys.all, "admin", "detail", productId] as const,
	},
} as const;
