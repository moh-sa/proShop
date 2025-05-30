import mongoose, { Error as MongooseError, Types } from "mongoose";
import { DatabaseError } from "../errors";
import { CacheManager } from "../managers";
import Product from "../models/productModel";
import {
  AllProducts,
  InsertProductWithStringImage,
  SelectProduct,
  TopRatedProduct,
} from "../types";

export interface IProductRepository {
  create(data: InsertProductWithStringImage): Promise<SelectProduct>;
  getById(data: { productId: Types.ObjectId }): Promise<SelectProduct | null>;
  update(data: {
    productId: Types.ObjectId;
    data: Partial<InsertProductWithStringImage>;
  }): Promise<SelectProduct | null>;
  delete(data: { productId: Types.ObjectId }): Promise<SelectProduct | null>;
  getTopRated(data: { limit?: number }): Promise<Array<TopRatedProduct>>;
  getAll(data: {
    query: Record<string, unknown>;
    numberOfProductsPerPage: number;
    currentPage: number;
  }): Promise<Array<AllProducts>>;
  count(query: Record<string, unknown>): Promise<number>;
}

export class ProductRepository implements IProductRepository {
  private readonly db: typeof Product;
  private cache: CacheManager;

  constructor(
    db: typeof Product = Product,
    cache: CacheManager = new CacheManager("product"),
  ) {
    this.db = db;
    this.cache = cache;
  }

  async create(data: InsertProductWithStringImage): Promise<SelectProduct> {
    try {
      const product = (await this.db.create(data)).toObject();

      const cacheKey = this.cache.generateKey({ id: product._id.toString() });
      this.cache.set({ key: cacheKey, value: product });

      return product;
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getById({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<SelectProduct | null> {
    const cacheKey = this.cache.generateKey({ id: productId.toString() });
    const cachedProduct = this.cache.get<SelectProduct>({ key: cacheKey });
    if (cachedProduct) return cachedProduct;

    try {
      const product = await this.db.findById(productId).lean();
      if (product) {
        this.cache.set({ key: cacheKey, value: product });
      }

      return product;
    } catch (error) {
      this.errorHandler(error);
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
      const product = await this.db
        .findByIdAndUpdate(productId, data, {
          new: true,
        })
        .lean();

      if (product) {
        this.invalidateProductCache({ id: productId.toString() });
      }

      return product;
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async delete({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<SelectProduct | null> {
    try {
      const deletedProduct = await this.db.findByIdAndDelete(productId).lean();
      if (deletedProduct) {
        this.invalidateProductCache({ id: productId.toString() });
      }

      return deletedProduct;
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getTopRated({
    limit = 3,
  }: {
    limit?: number;
  }): Promise<Array<TopRatedProduct>> {
    const cacheKey = this.cache.generateKey({ id: "top-rated" });
    const cachedProducts = this.cache.get<Array<TopRatedProduct>>({
      key: cacheKey,
    });
    if (cachedProducts) return cachedProducts;

    try {
      const products = await this.db
        .find({})
        .select("id name price image")
        .sort({ rating: -1 })
        .limit(limit)
        .lean();

      if (products) {
        this.cache.set({ key: cacheKey, value: products });
      }

      return products;
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getAll(data: {
    query: Record<string, unknown>;
    numberOfProductsPerPage: number;
    currentPage: number;
  }): Promise<Array<AllProducts>> {
    const cacheKey = this.cache.generateKey({ id: `all-${data.currentPage}` });
    const cachedProducts = this.cache.get<Array<AllProducts>>({
      key: cacheKey,
    });
    if (cachedProducts) return cachedProducts;

    try {
      return await this.db
        .find({ ...data.query })
        .select("id name brand category price rating numReviews image")
        .limit(data.numberOfProductsPerPage)
        .skip(data.numberOfProductsPerPage * (data.currentPage - 1))
        .lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async count(query: Record<string, unknown>): Promise<number> {
    try {
      return await this.db.countDocuments({ ...query }).lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  private errorHandler(error: unknown): never {
    if (
      error instanceof MongooseError ||
      error instanceof mongoose.mongo.MongoError
    ) {
      throw new DatabaseError(error.message);
    }
    throw new DatabaseError();
  }

  private invalidateProductCache({ id }: { id: string }): void {
    // Delete specific product cache
    const cacheKey = this.cache.generateKey({ id });
    this.cache.delete({ keys: cacheKey });

    // Delete all top-rated caches as they might be affected
    const stats = this.cache.stats();
    const keys = Object.keys(stats).filter((key) =>
      key.startsWith("product:top-rated"),
    );
    if (keys.length > 0) {
      this.cache.delete({ keys });
    }
  }
}
