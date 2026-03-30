import type { QueryFilter } from "mongoose";
import type z from "zod";

import type { paginationParamsSchema } from "../schemas/pagination/pagination.schema.js";
import type { DotPathRecord } from "./dot-path-record.type.js";
import type { Stringify } from "./stringify.type.js";

export interface PaginatedResponse<T> {
	items: Array<T>;
	meta: PaginationMeta;
}
export type PaginationFilter<T extends Record<string, unknown>> = T;

export interface PaginationMeta {
	currentPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export type PaginationParams = z.infer<typeof paginationParamsSchema>;

export type PaginationParamsStringified = Stringify<PaginationParams>;

export type PaginationQuery<T extends Record<string, unknown>> = QueryFilter<T>;

export type PaginationSelect<T extends Record<string, unknown>> = Partial<
	Record<keyof DotPathRecord<T>, true>
>;
