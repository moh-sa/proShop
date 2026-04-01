import type { z } from "zod";

import type {
	insertSessionSchema,
	selectSessionSchema,
	sessionPaginationFiltersSchema,
	sessionPaginationParamsSchema,
	sessionPaginationSortSchema,
} from "../schemas/index.js";
import type { PaginationFilter, PaginationSelect } from "./pagination.type.js";

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SelectSession = z.infer<typeof selectSessionSchema>;
export type SessionSchema = SelectSession;

// Pagination
export type SessionFilter = PaginationFilter<
	z.infer<typeof sessionPaginationFiltersSchema>
>;

export type SessionSelect = PaginationSelect<SelectSession>;

export type SessionSort = z.infer<typeof sessionPaginationSortSchema>;

// Method Params
type SessionPaginationParams = z.infer<typeof sessionPaginationParamsSchema>;
