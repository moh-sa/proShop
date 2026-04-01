import type { z } from "zod";

import type {
	insertSessionSchema,
	selectSessionSchema,
	sessionPaginationFiltersSchema,
} from "../schemas/index.js";
import type { PaginationFilter } from "./pagination.type.js";

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SelectSession = z.infer<typeof selectSessionSchema>;
export type SessionSchema = SelectSession;

// Pagination
export type SessionFilter = PaginationFilter<
	z.infer<typeof sessionPaginationFiltersSchema>
>;
