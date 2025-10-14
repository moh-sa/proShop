import type { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	AllProducts,
	FailureResult,
	InsertProductWithStringImage,
	MethodParams,
	MethodReturn,
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
	getAll(data: {
		currentPage: number;
		numberOfProductsPerPage: number;
		query: Record<string, unknown>;
	}): Promise<ProductResult<Array<AllProducts>>>;
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

	constructor(
		db: typeof Product = Product,
		cache: CacheService = new CacheService("product"),
	) {
		this._db = db;
		this._cache = cache;
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
			const isSet = this._cache.set({
				key: product._id.toString(),
				value: product,
			});
			if (!isSet.success) {
				console.error("Failed to set product cache", product._id.toString());
			}

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
		data: MethodParams<IProductRepository, "getAll">,
	): MethodReturn<IProductRepository, "getAll"> {
		const cachedProducts = this._cache.get<Array<AllProducts>>({
			key: `all-${data.currentPage}`,
		});
		if (!cachedProducts.success) {
			return cachedProducts;
		}
		if (cachedProducts.data) {
			return {
				data: cachedProducts.data,
				success: true,
			};
		}

		try {
			const result = await this._db
				.find({ ...data.query })
				.select("id name brand category price rating numReviews image")
				.limit(data.numberOfProductsPerPage)
				.skip(data.numberOfProductsPerPage * (data.currentPage - 1))
				.lean();

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
		const cachedProduct = this._cache.get<SelectProduct>({
			key: cacheId,
		});
		if (!cachedProduct.success) {
			return cachedProduct;
		}
		if (cachedProduct.data) {
			return {
				data: cachedProduct.data,
				success: true,
			};
		}

		try {
			const product = await this._db.findById(productId).lean();
			if (product) {
				const isSet = this._cache.set({ key: cacheId, value: product });
				if (isSet && !isSet.success) {
					console.error("Failed to set product cache", cacheId);
				}
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
		const cacheKey = "top-rated";
		const cachedProducts = this._cache.get<Array<TopRatedProduct>>({
			key: cacheKey,
		});
		if (!cachedProducts.success) {
			return cachedProducts;
		}
		if (cachedProducts.data) {
			return {
				data: cachedProducts.data,
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
				const isSet = this._cache.set({ key: cacheKey, value: products });
				if (isSet && !isSet.success) {
					console.error("Failed to set top-rated products cache", cacheKey);
				}
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
				this._invalidateProductCache({ id: productId.toString() });
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

	private _invalidateProductCache({ id }: { id: string }): void {
		// Delete specific product cache
		this._cache.delete({ key: id });

		// Delete all top-rated caches as they might be affected
		const stats = this._cache.getStats();
		const keys = Object.keys(stats).filter((key) =>
			key.startsWith("product:top-rated"),
		);
		if (keys.length > 0) {
			this._cache.deleteMany({ keys });
		}
	}
}
