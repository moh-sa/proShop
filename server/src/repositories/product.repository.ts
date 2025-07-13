import { Types } from "mongoose";
import { CacheManager } from "../managers";
import Product from "../models/productModel";
import {
  AllProducts,
  InsertProductWithStringImage,
  SelectProduct,
  TopRatedProduct,
} from "../types";
import { handleDatabaseError } from "../utils";

export interface IProductRepository {
  create(data: InsertProductWithStringImage): Promise<SelectProduct>;
  getById(data: { productId: Types.ObjectId }): Promise<SelectProduct | null>;
  update(data: {
    productId: Types.ObjectId;
    data: Partial<InsertProductWithStringImage>;
  }): Promise<SelectProduct | null>;
  delete(data: { productId: Types.ObjectId }): Promise<SelectProduct | null>;
  getTopRated(data: { limit: number }): Promise<Array<TopRatedProduct>>;
  getAll(data: {
    query: Record<string, unknown>;
    numberOfProductsPerPage: number;
    currentPage: number;
  }): Promise<Array<AllProducts>>;
  count(query: Record<string, unknown>): Promise<number>;
}

export class ProductRepository implements IProductRepository {
  private readonly _db: typeof Product;
  private _cache: CacheManager;

  constructor(
    db: typeof Product = Product,
    cache: CacheManager = new CacheManager("product"),
  ) {
    this._db = db;
    this._cache = cache;
  }

  async create(data: InsertProductWithStringImage): Promise<SelectProduct> {
    try {
      const product = (await this._db.create(data)).toObject();

      const cacheKey = this._cache.generateCacheKey({
        id: product._id.toString(),
      });
      this._cache.set({ key: cacheKey, value: product });

      return product;
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getById({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<SelectProduct | null> {
    const cacheKey = this._cache.generateCacheKey({ id: productId.toString() });
    const cachedProduct = this._cache.get<SelectProduct>({ key: cacheKey });
    if (cachedProduct) return cachedProduct;

    try {
      const product = await this._db.findById(productId).lean();
      if (product) {
        this._cache.set({ key: cacheKey, value: product });
      }

      return product;
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async update({
    productId,
    data,
  }: {
    productId: Types.ObjectId;
    data: Partial<InsertProductWithStringImage>;
  }): Promise<SelectProduct | null> {
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

  async delete({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<SelectProduct | null> {
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

  async getTopRated({
    limit,
  }: {
    limit: number;
  }): Promise<Array<TopRatedProduct>> {
    const cacheKey = this._cache.generateCacheKey({ id: "top-rated" });
    const cachedProducts = this._cache.get<Array<TopRatedProduct>>({
      key: cacheKey,
    });
    if (cachedProducts) return cachedProducts;

    try {
      const products = await this._db
        .find({})
        .select("id name price image")
        .sort({ rating: -1 })
        .limit(limit)
        .lean();

      if (products) {
        this._cache.set({ key: cacheKey, value: products });
      }

      return products;
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getAll(data: {
    query: Record<string, unknown>;
    numberOfProductsPerPage: number;
    currentPage: number;
  }): Promise<Array<AllProducts>> {
    const cacheKey = this._cache.generateCacheKey({
      id: `all-${data.currentPage}`,
    });
    const cachedProducts = this._cache.get<Array<AllProducts>>({
      key: cacheKey,
    });
    if (cachedProducts) return cachedProducts;

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

  async count(query: Record<string, unknown>): Promise<number> {
    try {
      return await this._db.countDocuments({ ...query }).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  private _errorHandler(error: unknown): never {
    return handleDatabaseError(error);
  }

  private _invalidateProductCache({ id }: { id: string }): void {
    // Delete specific product cache
    const cacheKey = this._cache.generateCacheKey({ id });
    this._cache.delete({ key: cacheKey });

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
