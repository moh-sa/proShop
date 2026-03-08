import type { FilterQuery, Model, PipelineStage } from "mongoose";

import type {
	PaginatedResponse,
	PaginationMeta,
	PaginationParams,
	PaginationParamsQuery,
} from "../types/index.js";

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
export class Paginator<TDocument> {
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

	/**
	 * Parse sort string into a sort object.
	 * @param input - The sort string to parse.
	 * @returns The sort object.
	 * @example
	 * const sort = Paginator.parseSort("createdAt:desc,name:asc");
	 */
	static handleSortString<TResult>(
		input: string,
	): Partial<Record<keyof TResult, -1 | 1>> {
		if (!input) {
			return {};
		}

		// TODO: handle security
		return input.split(",").reduce(
			(acc, item) => {
				const [key, direction] = item.split(":");
				acc[key as keyof TResult] = direction === "desc" ? -1 : 1;
				return acc;
			},
			{} as Partial<Record<keyof TResult, -1 | 1>>,
		);
	}

	/**
	 * Paginate documents with optional pipeline, query and sort.
	 * @returns `Items` and `totalItems` count.
	 * @example
	 * const result = await paginator.paginate({
	 *   page: { number: 1, size: 10 },
	 *   query: { category: "Tools", price: { $gte: 50, $lte: 80 } },
	 *   sort: { price: -1 },
	 *   pipeline: [
	 *     { $project: { name: 1, price: 1 } },
	 *   ],
	 * });
	 */
	public async paginate<TResult>(
		args: PaginationParamsQuery<TDocument>,
	): Promise<PaginatedResponse<TResult>> {
		const { pageNumber, pageSize, skip } = this._preparePaginationParams(args);

		const result = await this._query<TResult>({
			additionalAggregate: args.pipeline,
			limit: pageSize,
			query: args.query ?? {},
			skip,
			sort: args.sort ?? {},
		});

		const meta = this._generateMetaData({
			currentPage: pageNumber,
			pageSize,
			totalItems: result.totalItems,
		});

		return {
			items: result.items,
			meta,
		};
	}

	/**
	 * Paginate pre-fetched array of items.
	 * @returns `Items` and `totalItems` count.
	 * @example
	 * const result = await paginator.paginateArray<SelectProduct>({
	 *   items: [1, 2, 3, 4, 5],
	 *   pageNumber: 1,
	 *   pageSize: 10,
	 * });
	 */
	public paginateArray<TResult>(args: {
		items: Array<TResult>;
		pageNumber: number;
		pageSize?: number;
	}): PaginatedResponse<TResult> {
		const { pageNumber, pageSize, skip } = this._preparePaginationParams(args);

		const paginatedItems = args.items.slice(skip, skip + pageSize);
		const meta = this._generateMetaData({
			currentPage: pageNumber,
			pageSize,
			totalItems: args.items.length,
		});

		return {
			items: paginatedItems,
			meta,
		};
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
		return Math.max(1, Math.ceil(totalItems / pageSize));
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
		query: FilterQuery<TDocument>;
		skip: number;
		sort: Partial<Record<keyof TDocument, -1 | 1>>;
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
