import { MongooseError, Types } from "mongoose";
import { DatabaseError } from "../errors";
import Product from "../models/productModel";
import { InsertProduct, SelectProduct } from "../types";

class ProductRepository {
  async createProduct({
    productData,
  }: {
    productData: InsertProduct;
  }): Promise<SelectProduct> {
    try {
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
    try {
      return await Product.findById(productId);
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
      return await Product.findByIdAndUpdate(productId, updateData, {
        new: true,
      });
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async deleteProduct({ productId }: { productId: Types.ObjectId }) {
    try {
      return await Product.findByIdAndDelete(productId);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getTopRatedProducts({
    limit = 3,
  }: {
    limit?: number;
  }): Promise<Array<SelectProduct>> {
    try {
      return await Product.find({})
        .select("id name price image")
        .sort({ rating: -1 })
        .limit(limit);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getAllProducts(data: {
    query: Record<string, unknown>;
    numberOfProductsPerPage: number;
    currentPage: number;
  }): Promise<Array<SelectProduct>> {
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
    try {
      return Product.exists({
        _id: productId,
        "reviews.user": userId,
      });
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
}

export const productRepository = new ProductRepository();
