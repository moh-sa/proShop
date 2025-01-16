import { Types } from "mongoose";
import Product from "../models/productModel";
import { TInsertProduct, TSelectProduct } from "../types";

class ProductRepository {
  async createProduct({
    productData,
  }: {
    productData: TInsertProduct;
  }): Promise<TSelectProduct> {
    return Product.create(productData);
  }

  async getProductById({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<TSelectProduct | null> {
    return Product.findById(productId);
  }

  async updateProduct({
    productId,
    updateData,
  }: {
    productId: Types.ObjectId;
    updateData: Partial<TInsertProduct>;
  }): Promise<TSelectProduct | null> {
    return Product.findByIdAndUpdate(productId, updateData, { new: true });
  }

  async deleteProduct({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<void> {
    await Product.findByIdAndDelete(productId);
  }

  async getTopRatedProducts({
    limit = 3,
  }: {
    limit?: number;
  }): Promise<Array<TSelectProduct>> {
    return Product.find({}).sort({ rating: -1 }).limit(limit);
  }

  async getAllProducts(data: {
    query: Record<string, unknown>;
    numberOfProductsPerPage: number;
    currentPage: number;
  }): Promise<Array<TSelectProduct>> {
    return Product.find({ ...data.query })
      .limit(data.numberOfProductsPerPage)
      .skip(data.numberOfProductsPerPage * (data.currentPage - 1));
  }

  async count(query: Record<string, unknown>): Promise<number> {
    return Product.countDocuments({ ...query });
  }

  async reviewByUserExists({
    productId,
    userId,
  }: {
    productId: Types.ObjectId;
    userId: Types.ObjectId;
  }): Promise<{ _id: Types.ObjectId } | null> {
    return Product.exists({
      _id: productId,
      "reviews.user": userId,
    });
  }
}

export const productRepository = new ProductRepository();
