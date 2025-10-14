import type { FilterQuery, LeanDocument, Model, PipelineStage } from "mongoose";

import type { PaginationMeta, PaginationParams } from "../types/index.js";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/index.js";

export interface PaginatorConfig {
	defaultPageSize?: number;
	maxPageSize?: number;
}

/**
 * Generic Mongoose paginator. TResult allows projected shapes.
 * @generic `TDocument` - The type of the document to paginate.
 * @example
 * type ProductPaginator = Paginator<SelectProduct>
 *  */
export class Paginator<TDocument extends LeanDocument<unknown>> {
	private readonly _defaultPageSize: number;
	private readonly _maxPageSize: number;

	/**
	 * @param _model Mongoose model
	 * @param config Defaults and caps for page size
	 * @example
	 * const paginator = new Paginator(Product);
	 */
	constructor(
		private _model: Model<TDocument>,
		config?: PaginatorConfig,
	) {
		this._defaultPageSize = config?.defaultPageSize ?? DEFAULT_PAGE_SIZE;
		this._maxPageSize = config?.maxPageSize ?? MAX_PAGE_SIZE;
	}

	private _calculatePageNumber(pageNumber: number): number {
		return Math.floor(Math.max(1, pageNumber));
	}

	private _calculatePageSize(size?: number): number {
		const fallbackSize = size ?? this._defaultPageSize;
		const atLeastOne = Math.max(1, fallbackSize);
		const sizeRange = Math.min(this._maxPageSize, atLeastOne);
		return Math.floor(sizeRange);
	}

	private _calculateSkip(pageNumber: number, pageSize: number): number {
		return (pageNumber - 1) * pageSize;
	}

	private _calculateTotalPages(totalItems: number, pageSize: number): number {
		return Math.ceil(totalItems / pageSize);
	}

	private _hasNextPage(currentPage: number, totalPages: number): boolean {
		return currentPage < totalPages;
	}

	private _hasPreviousPage(currentPage: number): boolean {
		return currentPage > 1;
	}

	/**
	 * Generate pagination meta
	 * @returns object with `currentPage`, `hasNextPage`, `hasPreviousPage`, `pageSize`, `totalItems`, and `totalPages`
	 */
	private _generateMetaData(args: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
	}): PaginationMeta {
		const totalPages = this._calculateTotalPages(
			args.totalItems,
			args.pageSize,
		);

		const hasNextPage = this._hasNextPage(args.currentPage, totalPages);
		const hasPreviousPage = this._hasPreviousPage(args.currentPage);

		return {
			currentPage: args.currentPage,
			hasNextPage,
			hasPreviousPage,
			pageSize: args.pageSize,
			totalItems: args.totalItems,
			totalPages,
		};
	}

	/**
	 * Prepare pagination parameters.
	 * @returns `pageNumber`, `pageSize`, and `skip`.
	 */
	private _preparePaginationParams(
		args: Pick<PaginationParams<TDocument>, "pageNumber" | "pageSize">,
	): { pageNumber: number; pageSize: number; skip: number } {
		const pageNumber = this._calculatePageNumber(args.pageNumber);
		const pageSize = this._calculatePageSize(args.pageSize);
		const skip = this._calculateSkip(pageNumber, pageSize);

		return { pageNumber, pageSize, skip };
	}

	/** Build and run aggregation for items and total count. */
	private async _query<TResult>(args: {
		additionalAggregate?: Array<PipelineStage>;
		limit: number;
		query: FilterQuery<LeanDocument<TDocument>>;
		skip: number;
		sort: Partial<Record<keyof LeanDocument<TDocument>, -1 | 1>>;
	}): Promise<{
		items: Array<TResult>;
		totalItems: number;
	}> {
		const hasSort = args.sort && Object.keys(args.sort).length > 0;
		// Fallback to sort by `createdAt` if sort is not provided
		const sort = hasSort
			? (args.sort as Record<string, -1 | 1>)
			: ({ createdAt: -1 } as Record<string, -1 | 1>);

		// used `aggregate` to combine find and count in one operation
		const [result = { items: [], meta: [] }] = await this._model.aggregate<{
			items: Array<TResult>;
			meta: Array<{ totalItems: number }>;
		}>([
			{ $match: args.query },
			...(args.additionalAggregate ?? []),
			{
				$facet: {
					items: [
						{ $sort: sort },
						{ $skip: args.skip },
						{ $limit: args.limit },
					],
					meta: [{ $count: "totalItems" }],
				},
			},
		]);

		const items = result.items ?? [];
		const totalItems = result.meta?.[0]?.totalItems ?? 0;

		return {
			items,
			totalItems,
		};
	}
}
