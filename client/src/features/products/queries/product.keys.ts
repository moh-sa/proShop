export const productKeys = {
	all: ["products"] as const,
	_lists: () => [...productKeys.all, "list"] as const,
	topRated: () => [...productKeys._lists(), "top-rated"] as const,
} as const;
