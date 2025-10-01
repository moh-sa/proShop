import type { Types } from "mongoose";

import type {
	AllProducts,
	InsertProductWithStringImage,
	MethodParams,
	MethodReturn,
	SelectProduct,
	TopRatedProduct,
} from "../types/index.js";

import Product from "../models/product.model.js";
import { CacheService } from "../services/index.js";
import { handleDatabaseError } from "../utils/index.js";

export interface IProductRepository {
	count(query: Record<string, unknown>): Promise<number>;
	create(data: InsertProductWithStringImage): Promise<SelectProduct>;
	delete(data: { productId: Types.ObjectId }): Promise<null | SelectProduct>;
	getAll(data: {
		currentPage: number;
		numberOfProductsPerPage: number;
		query: Record<string, unknown>;
	}): Promise<Array<AllProducts>>;
	getById(data: { productId: Types.ObjectId }): Promise<null | SelectProduct>;
	getTopRated(data: { limit: number }): Promise<Array<TopRatedProduct>>;
	update(data: {
		data: Partial<InsertProductWithStringImage>;
		productId: Types.ObjectId;
	}): Promise<null | SelectProduct>;
}

export class ProductRepository implements IProductRepository {
	private _cache: CacheService;
	private readonly _db: typeof Product;

	constructor(
		db: typeof Product = Product,
		cache: CacheService = new CacheService("product"),
	) {
		this._db = db;
		this._cache = cache;
	}

	async count(
		query: MethodParams<IProductRepository, "count">,
	): MethodReturn<IProductRepository, "count"> {
		try {
			return await this._db.countDocuments({ ...query }).lean();
		} catch (error) {
			this._errorHandler(error);
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

			return product;
		} catch (error) {
			this._errorHandler(error);
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

			return deletedProduct;
		} catch (error) {
			this._errorHandler(error);
		}
	}

	async getAll(
		data: MethodParams<IProductRepository, "getAll">,
	): MethodReturn<IProductRepository, "getAll"> {
		const cachedProducts = this._cache.get<Array<AllProducts>>({
			key: `all-${data.currentPage}`,
		});
		if (cachedProducts.success) {
			return cachedProducts.data;
		}

		try {
			return await this._db
				.find({ ...data.query })
				.select("id name brand category price rating numReviews image")
				.limit(data.numberOfProductsPerPage)
				.skip(data.numberOfProductsPerPage * (data.currentPage - 1))
				.lean();
		} catch (error) {
			this._errorHandler(error);
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
		if (cachedProduct.success) {
			return cachedProduct.data;
		}

		try {
			const product = await this._db.findById(productId).lean();
			if (product) {
				const isSet = this._cache.set({ key: cacheId, value: product });
				if (isSet && !isSet.success) {
					console.error("Failed to set product cache", cacheId);
				}
			}

			return product;
		} catch (error) {
			this._errorHandler(error);
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
		if (cachedProducts.success) {
			return cachedProducts.data;
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

			return products;
		} catch (error) {
			this._errorHandler(error);
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

			return product;
		} catch (error) {
			this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): never {
		return handleDatabaseError(error);
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
