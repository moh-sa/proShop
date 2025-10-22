import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "../constants/pagination.constants.js";
import { Paginator } from "../utils/paginator.util.js";

export const paginationParamsValidator = z.object({
	pageNumber: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce
		.number()
		.int()
		.positive()
		.optional()
		.default(DEFAULT_PAGE_SIZE),
	query: z.string().trim().min(1).optional(),
	sort: z
		.string()
		.trim()
		.min(1)
		.optional()
		.transform((val) => (val ? Paginator.handleSortString(val) : undefined)),
});
