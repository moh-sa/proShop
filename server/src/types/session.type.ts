import type { z } from "zod";

import type {
	createSessionSchema,
	sessionModelSchema,
	sessionPaginationFiltersSchema,
	sessionPaginationParamsSchema,
	sessionPaginationSortSchema,
	sessionSchema,
} from "../schemas/index.js";
import type {
	PaginationFilter,
	PaginationParamsStringified,
	PaginationSelect,
} from "./pagination.type.js";

export type CreateSession = z.infer<typeof createSessionSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type SessionSchema = z.infer<typeof sessionModelSchema>;

// Pagination
export type SessionFilter = PaginationFilter<
	z.infer<typeof sessionPaginationFiltersSchema>
>;

export type SessionSelect = PaginationSelect<Session>;

export type SessionSort = z.infer<typeof sessionPaginationSortSchema>;

// Method Params
export type GetAllSessionsByUserIdControllerParams =
	PaginationParamsStringified & {
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
