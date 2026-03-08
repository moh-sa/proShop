import type { PipelineStage, QueryFilter } from "mongoose";

export interface PaginatedResponse<T> {
	items: Array<T>;
	meta: PaginationMeta;
}

export interface PaginationMeta {
	currentPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

export type PaginationParams<TDocument> = {
	pageNumber: number;
	pageSize?: number;
	/** `1` - ascending, `-1` - descending */
	sort?: Partial<Record<keyof TDocument, -1 | 1>>;
};

export type PaginationParamsQuery<TDocument> = PaginationParams<TDocument> &
	PaginationQuery<TDocument>;

/**
 * String version of PaginationParams, for use in service and controller layers only.
 */
export type PaginationParamsString = {
	[key in keyof PaginationParams<unknown>]: string;
};

export type PaginationQuery<TDocument> = {
	pipeline?: Array<PipelineStage>;
	query?: PipelineStage.Match["$match"] & QueryFilter<TDocument>;
};
