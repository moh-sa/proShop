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
	pipeline?: Array<PipelineStage>;
	query?: FilterQuery<LeanDocument<TDocument>>;
	sort?: Partial<Record<keyof LeanDocument<TDocument>, -1 | 1>>;
};
