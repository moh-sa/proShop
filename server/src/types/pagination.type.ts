import type { FilterQuery, LeanDocument, PipelineStage } from "mongoose";

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
	sort?: Partial<Record<keyof LeanDocument<TDocument>, -1 | 1>>;
};

export type PaginationParamsQuery<TDocument> = PaginationParams<TDocument> &
	PaginationQuery<TDocument>;

export type PaginationQuery<TDocument> = {
	pipeline?: Array<PipelineStage>;
	query?: FilterQuery<LeanDocument<TDocument>>;
};
