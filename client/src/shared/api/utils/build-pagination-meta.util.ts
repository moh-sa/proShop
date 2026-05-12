import type { PaginationMeta } from "../types";

/** Matches server Paginator meta: totalPages = max(1, ceil(totalItems / pageSize)), next/prev flags. */
export function buildPaginationMeta(args: {
	currentPage: number;
	pageSize: number;
	totalItems: number;
}): PaginationMeta {
	const { currentPage, pageSize, totalItems } = args;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

	return {
		currentPage,
		hasNextPage: currentPage < totalPages,
		hasPreviousPage: currentPage > 1,
		pageSize,
		totalItems,
		totalPages,
	};
}
