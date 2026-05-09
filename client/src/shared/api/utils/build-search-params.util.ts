import type { PaginationParams } from "@/features/pagination";

export function buildSearchParams(params: PaginationParams) {
	const queryParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value) {
			queryParams.set(key, value.toString());
		}
	});
	return queryParams.toString();
}
