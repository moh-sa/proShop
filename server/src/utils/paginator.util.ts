import type { Model, PipelineStage } from "mongoose";

import type {
	DotPathRecord,
	PaginatedResponse,
	PaginationMeta,
	PaginationParams,
	PaginationQuery,
	PaginationSelect,
} from "../types/index.js";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/index.js";

export interface PaginatorConfig {
	defaultPageSize?: number;
	maxPageSize?: number;
}

export type PaginatorParams<T extends Record<string, unknown>> =
	PaginationParams & {
		pipeline?: PaginatorPipeline;
		query?: PaginatorQuery<T>;
		select?: PaginationSelect<T>;
		sort?: PaginatorSort<T>;
	};

type PaginatorPipeline = Array<PipelineStage>;

type PaginatorQuery<T extends Record<string, unknown>> = PaginationQuery<T>;

type PaginatorSort<T extends Record<string, unknown>> = Partial<
	Record<keyof T, "asc" | "desc">
>;

type ProjectionSort<T extends Record<string, unknown>> = Partial<
	Record<keyof DotPathRecord<T>, -1 | 1>
>;

/**
 * Generic Mongoose paginator. TResult allows projected shapes.
 * @generic `TDocument` - The type of the document to paginate.
 * @example
 * type ProductPaginator = Paginator<SelectProduct>
 *  */
export class Paginator<TDocument extends Record<string, unknown>> {
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
		args: PaginatorParams<TDocument>,
	): Promise<PaginatedResponse<TResult>> {
		const { pageNumber, pageSize, skip } = this._preparePaginationParams(args);
		const sort = this._prepareSort(args.sort);

		const selectStage = args.select
			? [{ $project: this._buildSelectProjection(args.select) }]
			: [];
		const additionalAggregate = [...(args.pipeline ?? []), ...selectStage];

		const result = await this._query<TResult>({
			additionalAggregate,
			limit: pageSize,
			query: args.query ?? {},
			skip,
			sort,
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
		pageSize: number;
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
	 * Builds a MongoDB `$project` shape from a select object (dot-path keys).
	 */
	private _buildSelectProjection(
		select: PaginationSelect<TDocument>,
	): Record<string, unknown> {
		const entries = Object.entries(select)
			.filter(([_, value]) => value === true)
			.map(([key]) => {
				const mappedValue = key.includes(".") ? `$${key}` : 1;
				return [key, mappedValue];
			});

		return Object.fromEntries(entries);
	}

	/**
	 * Normalize the sort object to the database values.
	 * @example
	 * this._prepareSort({ createdAt: "desc", name: "asc", price: undefined });
	 * // ->  { createdAt: -1, name: 1 }
	 */
	private _prepareSort(
		sort?: PaginatorSort<TDocument>,
	): ProjectionSort<TDocument> {
		if (!sort) {
			return {};
		}

		const normalizedEntries = Object.entries(sort)
			// remove undefined values
			.filter(([_, value]) => Boolean(value))
			.map(([key, value]) => [key, value === "desc" ? -1 : 1]);

		return Object.fromEntries(normalizedEntries);
	}

	/**
	 * Prepare pagination parameters.
	 * @returns `pageNumber`, `pageSize`, and `skip`.
	 */
	private _preparePaginationParams(args: PaginationParams): {
		pageNumber: number;
		pageSize: number;
		skip: number;
	} {
		const pageNumber = this._calculatePageNumber(args.pageNumber);
		const pageSize = this._calculatePageSize(args.pageSize);
		const skip = this._calculateSkip(pageNumber, pageSize);

		return { pageNumber, pageSize, skip };
	}

	/** Build and run aggregation for items and total count. */
	private async _query<TResult>(args: {
		additionalAggregate?: PaginatorPipeline;
		limit: number;
		query: PaginatorQuery<TDocument>;
		skip: number;
		sort: ProjectionSort<TDocument>;
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
			{
				// `PipelineStage.Match["$match"]` is QueryFilter<any> internally
				$match: args.query as PipelineStage.Match["$match"],
			},
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
