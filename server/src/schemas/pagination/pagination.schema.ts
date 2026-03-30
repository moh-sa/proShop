import z from "zod";

import { DEFAULT_PAGE_SIZE } from "../../constants/index.js";

export const paginationParamsSchema = z.object({
	pageNumber: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().default(DEFAULT_PAGE_SIZE),
});
