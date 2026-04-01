import type { z } from "zod";

import type {
	insertSessionSchema,
	selectSessionSchema,
	sessionPaginationFiltersSchema,
	sessionPaginationParamsSchema,
	sessionPaginationSortSchema,
} from "../schemas/index.js";
import type {
	PaginationFilter,
	PaginationParamsStringified,
	PaginationSelect,
} from "./pagination.type.js";

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
export type GetAllSessionsByUserIdControllerParams =
	PaginationParamsStringified & {
		refreshToken: string;
		sort?: string;
	};

export type GetAllSessionsByUserIdManagerParams =
	PaginationParamsStringified & {
		refreshToken: string;
		sort?: string;
	};

export type GetAllSessionsByUserIdRepositoryParams =
	GetAllSessionsRepositoryParams & {
		userId: string;
	};

export type GetAllSessionsByUserIdServiceParams =
	PaginationParamsStringified & {
		sort?: string;
		userId: string;
	};

export type GetAllSessionsRepositoryParams = SessionPaginationParams & {
	select?: SessionSelect;
};

type SessionPaginationParams = z.infer<typeof sessionPaginationParamsSchema>;
