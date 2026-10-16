export const authKeys = {
	all: ["auth"] as const,
	me: () => [...authKeys.all, "me"] as const,
	_lists: () => [...authKeys.all, "list"] as const,
	sessions: () => [...authKeys._lists(), "sessions"] as const,
} as const;
