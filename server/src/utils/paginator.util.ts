import type { LeanDocument, Model } from "mongoose";

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
}
