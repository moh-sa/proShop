import type { z } from "zod";

import type {
	insertSessionSchema,
	selectSessionSchema,
} from "../schemas/index.js";
import type { PaginationParamsString } from "./pagination.type.js";

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SelectSession = z.infer<typeof selectSessionSchema>;
export type SessionSchema = SelectSession;

// Pagination
export type SessionPaginationParams = PaginationParamsString & {
	userId: string;
};
