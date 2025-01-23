import { MongooseError, Types } from "mongoose";
import { DatabaseError } from "../errors";
import { CacheManager } from "../managers";
import Product from "../models/productModel";
import { InsertProduct, SelectProduct } from "../types";

class ProductRepository {
  private cache: CacheManager;

  constructor() {
    this.cache = new CacheManager("product");
  }

  async createProduct({
    productData,
  }: {
    productData: InsertProduct;
  }): Promise<SelectProduct> {
    try {
      const product = await Product.create(productData);

      const cacheKey = this.cache.generateKey({ id: product._id.toString() });
      this.cache.set({ key: cacheKey, value: product });

      return await Product.create(productData);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getProductById({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<SelectProduct | null> {
    const cacheKey = this.cache.generateKey({ id: productId.toString() });
    const cachedProduct = this.cache.get<SelectProduct>({ key: cacheKey });
    if (cachedProduct) return cachedProduct;

    try {
      const product = await Product.findById(productId);
      if (product) {
        this.cache.set({ key: cacheKey, value: product });
      }

      return product;
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async updateProduct({
    productId,
    updateData,
  }: {
    productId: Types.ObjectId;
    updateData: Partial<InsertProduct>;
  }): Promise<SelectProduct | null> {
    try {
      const product = await Product.findByIdAndUpdate(productId, updateData, {
        new: true,
      });

      if (product) {
        this.invalidateProductCache({ id: productId.toString() });
      }

      return product;
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async deleteProduct({ productId }: { productId: Types.ObjectId }) {
    try {
      await Product.findByIdAndDelete(productId);
      this.invalidateProductCache({ id: productId.toString() });
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getTopRatedProducts({
    limit = 3,
  }: {
    limit?: number;
  }): Promise<Array<SelectProduct>> {
    const cacheKey = this.cache.generateKey({ id: "top-rated" });
    const cachedProducts = this.cache.get<Array<SelectProduct>>({
      key: cacheKey,
    });
    if (cachedProducts) return cachedProducts;

    try {
      const products = await Product.find({})
        .select("id name price image")
        .sort({ rating: -1 })
        .limit(limit);

      if (products) {
        this.cache.set({ key: cacheKey, value: products });
      }

      return products;
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getAllProducts(data: {
    query: Record<string, unknown>;
    numberOfProductsPerPage: number;
    currentPage: number;
  }): Promise<Array<SelectProduct>> {
    const cacheKey = this.cache.generateKey({ id: `all-${data.currentPage}` });
    const cachedProducts = this.cache.get<Array<SelectProduct>>({
      key: cacheKey,
    });
    if (cachedProducts) return cachedProducts;

    try {
      return await Product.find({ ...data.query })
        .select("id name brand category price rating numReviews image")
        .limit(data.numberOfProductsPerPage)
        .skip(data.numberOfProductsPerPage * (data.currentPage - 1));
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async count(query: Record<string, unknown>): Promise<number> {
    try {
      return await Product.countDocuments({ ...query });
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async reviewByUserExists({
    productId,
    userId,
  }: {
    productId: Types.ObjectId;
    userId: Types.ObjectId;
  }): Promise<{ _id: Types.ObjectId } | null> {
    const cacheKey = this.cache.generateKey({
      id: `${productId}:${userId}`,
    });
    const cachedReview = this.cache.get<{ _id: Types.ObjectId } | null>({
      key: cacheKey,
    });
    if (cachedReview) return cachedReview;

    try {
      const isReviewed = Product.exists({
        _id: productId,
        "reviews.user": userId,
      });

      this.cache.set({ key: cacheKey, value: isReviewed });

      return isReviewed;
    } catch (error) {
      this.errorHandler(error);
    }
  }

  private errorHandler(error: unknown): never {
    if (error instanceof MongooseError) {
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

export const productRepository = new ProductRepository();
