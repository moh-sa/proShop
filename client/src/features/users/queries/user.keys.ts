export const userKeys = {
	all: ["users"] as const,
	_lists: () => [...userKeys.all, "list"] as const,
	detail: (userId: string) => [...userKeys.all, "detail", userId] as const,
	admin: {
		list: (params?: Record<string, unknown>) =>
			[...userKeys.all, "admin", "list", params] as const,
		detail: (userId: string) =>
			[...userKeys.all, "admin", "detail", userId] as const,
	},
} as const;
