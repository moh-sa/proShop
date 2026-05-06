import type { PaginationParams } from "@/features/pagination";

export const authKeys = {
	all: ["auth"] as const,
	me: () => [...authKeys.all, "me"] as const,
	_lists: () => [...authKeys.all, "list"] as const,
	sessions: (params: PaginationParams) =>
		[...authKeys._lists(), "sessions", params] as const,
} as const;
