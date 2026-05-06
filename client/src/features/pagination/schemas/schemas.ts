import z from "zod";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "../consts";

export const paginationParamsSchema = z.object({
	pageNumber: z.number().int().positive().default(DEFAULT_PAGE_NUMBER),
	pageSize: z.number().int().positive().default(DEFAULT_PAGE_SIZE),
});
