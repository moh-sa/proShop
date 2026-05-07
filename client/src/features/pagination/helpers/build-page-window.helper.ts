/**
 * Builds the visible page window with ellipsis markers.
 * Always shows: page 1, page `total`, and current ± 1.
 * Gaps larger than 1 between consecutive visible pages are bridged with "ellipsis".
 *
 * Example (total=22, current=10): [1, "…", 9, 10, 11, "…", 22]
 */
export function buildPageWindow(
	current: number,
	totalPages: number,
): (number | "ellipsis")[] {
	if (totalPages <= 1) return [1];

	const neighborStart = Math.max(2, current - 1);
	const neighborEnd = Math.min(totalPages - 1, current + 1);

	const visiblePages = new Set([1, totalPages]);
	for (let p = neighborStart; p <= neighborEnd; p++) {
		visiblePages.add(p);
	}

	const sortedPages = [...visiblePages].sort((a, b) => a - b);

	return sortedPages.flatMap((page, index, arr) => {
		const needsEllipsis = index > 0 && page - arr[index - 1] > 1;
		return needsEllipsis ? ["ellipsis", page] : [page];
	});
}
