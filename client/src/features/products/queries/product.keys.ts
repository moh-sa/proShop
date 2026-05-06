import type { PaginationParams } from "@/features/pagination";

export const productKeys = {
	all: ["products"] as const,
	_lists: () => [...productKeys.all, "list"] as const,
	list: (params: PaginationParams) =>
		[...productKeys._lists(), params] as const,
	topRated: () => [...productKeys._lists(), "top-rated"] as const,
} as const;
