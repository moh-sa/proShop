import type { DatabaseBaseError } from "../errors/index.js";
import { ProductModel } from "../models/product.model.js";
import { CacheService } from "../services/cache.service.js";
import type {
	AllProducts,
	CreateProductWithStringImage,
	FailureResult,
	GetAllProductsRepositoryParams,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	PaginationQuery,
	Product,
	ProductFilter,
	ProductSchema,
	Result,
	TopRatedProduct,
} from "../types/index.js";
import {
	handleDatabaseErrorResult,
	Paginator,
	serializeMongoResult,
} from "../utils/index.js";

export interface IProductRepository {
	count(query: Record<string, unknown>): Promise<ProductResult<number>>;
	create(data: CreateProductWithStringImage): Promise<ProductResult<Product>>;
	delete(data: { productId: string }): Promise<ProductResult<null | Product>>;
	getAll(
		args: GetAllProductsRepositoryParams,
	): Promise<ProductResult<PaginatedResponse<AllProducts>>>;
	getById(data: { productId: string }): Promise<ProductResult<null | Product>>;
	getTopRated(data: {
		limit: number;
	}): Promise<ProductResult<Array<TopRatedProduct>>>;
	update(data: {
		data: Partial<CreateProductWithStringImage>;
		productId: string;
	}): Promise<ProductResult<null | Product>>;
}

type ProductResult<T> = Result<T, DatabaseBaseError>;

export class ProductRepository implements IProductRepository {
	private _cache: CacheService;
	private readonly _db: typeof ProductModel;
	private _paginator: Paginator<ProductSchema, Product>;

	// Cache keys
	private readonly _getTopRatedCacheKey = "top-rated";

	constructor(db?: typeof ProductModel, cache?: CacheService) {
		this._db = db ?? ProductModel;
		this._cache = cache ?? new CacheService("product");
		this._paginator = new Paginator(this._db);
	}

	public async count(
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

	public async create(
		data: MethodParams<IProductRepository, "create">,
	): MethodReturn<IProductRepository, "create"> {
		try {
			const product = await this._db.create(data);
			const serializedProduct = serializeMongoResult(product.toObject());

			this._cache.set({
				key: serializedProduct.id,
				value: serializedProduct,
			});

			return {
				data: serializedProduct,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async delete({
		productId,
	}: MethodParams<IProductRepository, "delete">): MethodReturn<
		IProductRepository,
		"delete"
	> {
		try {
			const deletedProduct = await this._db.findByIdAndDelete(productId).lean();
			const serializedProduct = serializeMongoResult(deletedProduct);

			if (serializedProduct) {
				this._invalidateProductCache({ id: serializedProduct.id });
			}

			return {
				data: serializedProduct,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAll(
		args: MethodParams<IProductRepository, "getAll">,
	): MethodReturn<IProductRepository, "getAll"> {
		try {
			const result = await this._paginator.paginate<AllProducts>({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: args.filters && this._prepareFilter(args.filters),
				select: args.select,
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

	public async getById({
		productId,
	}: MethodParams<IProductRepository, "getById">): MethodReturn<
		IProductRepository,
		"getById"
	> {
		const cacheId = productId;
		const getCachedResult = this._cache.get<Product>({
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
			const serializedProduct = serializeMongoResult(product);

			if (serializedProduct) {
				this._cache.set({
					key: cacheId,
					value: serializedProduct,
				});
			}

			return {
				data: serializedProduct,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getTopRated({
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
			const serializedProducts = serializeMongoResult(products);

			if (serializedProducts) {
				this._cache.set({
					key: this._getTopRatedCacheKey,
					value: serializedProducts,
				});
			}

			return {
				data: serializedProducts,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async update({
		data,
		productId,
	}: MethodParams<IProductRepository, "update">): MethodReturn<
		IProductRepository,
		"update"
	> {
		try {
			const product = await this._db
				.findByIdAndUpdate(productId, data, {
					returnDocument: "after",
				})
				.lean();
			const serializedProduct = serializeMongoResult(product);

			if (serializedProduct) {
				const cacheKey = serializedProduct.id;
				this._invalidateProductCache({ id: cacheKey });
				this._cache.set({
					key: cacheKey,
					value: serializedProduct,
				});
			}

			return {
				data: serializedProduct,
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

	private _prepareFilter(
		filters?: ProductFilter,
	): Partial<PaginationQuery<ProductSchema>> {
		if (!filters) {
			return {};
		}

		const newFilter: Partial<PaginationQuery<ProductSchema>> = {};

		if (filters.keyword) {
			newFilter.$text = { $search: filters.keyword };
		}

		if (filters.brand) {
			newFilter.brand = filters.brand;
		}

		if (filters.category) {
			newFilter.category = filters.category;
		}

		return newFilter;
	}
}

export const productRepository = new ProductRepository();
