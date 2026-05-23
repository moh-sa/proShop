export const reviewKeys = {
	all: ["reviews"] as const,
	_lists: () => [...reviewKeys.all, "list"] as const,
	_counts: () => [...reviewKeys.all, "count"] as const,
	listByProduct: (productId: string) =>
		[...reviewKeys._lists(), "product", productId] as const,
	existsUserProduct: (userId: string, productId: string) =>
		[...reviewKeys.all, "exists", { userId, productId }] as const,
	countUser: (userId: string) =>
		[...reviewKeys._counts(), "user", userId] as const,
} as const;
