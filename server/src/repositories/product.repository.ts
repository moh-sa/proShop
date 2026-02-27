import type { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	AllProducts,
	FailureResult,
	InsertProductWithStringImage,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	PaginationParamsQuery,
	Result,
	SelectProduct,
	TopRatedProduct,
} from "../types/index.js";

import Product from "../models/product.model.js";
import { CacheService } from "../services/index.js";
import { handleDatabaseErrorResult, Paginator } from "../utils/index.js";

export interface IProductRepository {
	count(query: Record<string, unknown>): Promise<ProductResult<number>>;
	create(
		data: InsertProductWithStringImage,
	): Promise<ProductResult<SelectProduct>>;
	delete(data: {
		productId: Types.ObjectId;
	}): Promise<ProductResult<null | SelectProduct>>;
	getAll(
		args: PaginationParamsQuery<SelectProduct>,
	): Promise<ProductResult<PaginatedResponse<AllProducts>>>;
	getById(data: {
		productId: Types.ObjectId;
	}): Promise<ProductResult<null | SelectProduct>>;
	getTopRated(data: {
		limit: number;
	}): Promise<ProductResult<Array<TopRatedProduct>>>;
	update(data: {
		data: Partial<InsertProductWithStringImage>;
		productId: Types.ObjectId;
	}): Promise<ProductResult<null | SelectProduct>>;
}

type ProductResult<T> = Result<T, DatabaseBaseError>;

export class ProductRepository implements IProductRepository {
	private _cache: CacheService;
	private readonly _db: typeof Product;
	private _paginator: Paginator<SelectProduct>;

	// Cache keys
	private readonly _getTopRatedCacheKey = "top-rated";

	constructor(db?: typeof Product, cache?: CacheService) {
		this._db = db ?? Product;
		this._cache = cache ?? new CacheService("product");
		this._paginator = new Paginator(this._db);
	}

	async count(
		query: MethodParams<IProductRepository, "count">,
	): MethodReturn<IProductRepository, "count"> {
		try {
			const result = await this._db.countDocuments({ ...query }).lean();
			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async create(
		data: MethodParams<IProductRepository, "create">,
	): MethodReturn<IProductRepository, "create"> {
		try {
			const product = (await this._db.create(data)).toObject();
			this._cache.set({
				key: product._id.toString(),
				value: product,
			});

			return {
				data: product,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async delete({
		productId,
	}: MethodParams<IProductRepository, "delete">): MethodReturn<
		IProductRepository,
		"delete"
	> {
		try {
			const deletedProduct = await this._db.findByIdAndDelete(productId).lean();
			if (deletedProduct) {
				this._invalidateProductCache({ id: productId.toString() });
			}

			return {
				data: deletedProduct,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getAll(
		args: MethodParams<IProductRepository, "getAll">,
	): MethodReturn<IProductRepository, "getAll"> {
		try {
			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: args.query,
				sort: args.sort,
			});

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getById({
		productId,
	}: MethodParams<IProductRepository, "getById">): MethodReturn<
		IProductRepository,
		"getById"
	> {
		const cacheId = productId.toString();
		const getCachedResult = this._cache.get<SelectProduct>({
			key: cacheId,
		});
		if (!getCachedResult.success) {
			return getCachedResult;
		}
		if (getCachedResult.data) {
			return {
				data: getCachedResult.data,
				success: true,
			};
		}

		try {
			const product = await this._db.findById(productId).lean();
			if (product) {
				this._cache.set({
					key: cacheId,
					value: product,
				});
			}

			return {
				data: product,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getTopRated({
		limit,
	}: MethodParams<IProductRepository, "getTopRated">): MethodReturn<
		IProductRepository,
		"getTopRated"
	> {
		const getCachedResult = this._cache.get<Array<TopRatedProduct>>({
			key: this._getTopRatedCacheKey,
		});
		if (!getCachedResult.success) {
			return getCachedResult;
		}
		if (getCachedResult.data) {
			return {
				data: getCachedResult.data,
				success: true,
			};
		}

		try {
			const products = await this._db
				.find({})
				.select("id name price image")
				.sort({ rating: -1 })
				.limit(limit)
				.lean();

			if (products) {
				this._cache.set({
					key: this._getTopRatedCacheKey,
					value: products,
				});
			}

			return {
				data: products,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async update({
		data,
		productId,
	}: MethodParams<IProductRepository, "update">): MethodReturn<
		IProductRepository,
		"update"
	> {
		try {
			const product = await this._db
				.findByIdAndUpdate(productId, data, {
					new: true,
				})
				.lean();

			if (product) {
				const cacheKey = productId.toString();
				this._invalidateProductCache({ id: cacheKey });
				this._cache.set({
					key: cacheKey,
					value: product,
				});
			}

			return {
				data: product,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): FailureResult<DatabaseBaseError> {
		return handleDatabaseErrorResult(error);
	}

	private _invalidateProductCache({ id }: { id?: string } = {}): void {
		// delete specific product cache
		if (id && id.trim().length > 0) {
			this._cache.delete({ key: id });
		}

		// delete top-rated products cache
		this._cache.delete({
			key: this._getTopRatedCacheKey,
		});
	}
}

export const productRepository = new ProductRepository();
