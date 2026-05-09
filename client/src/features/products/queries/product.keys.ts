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
} as const;
