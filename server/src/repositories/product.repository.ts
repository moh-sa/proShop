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
    productId: string;
  }): Promise<TSelectProduct | null> {
    return Product.findById(productId);
  }

  async updateProduct({
    productId,
    updateData,
  }: {
    productId: string;
    updateData: Partial<TInsertProduct>;
  }): Promise<TSelectProduct | null> {
    return Product.findByIdAndUpdate(productId, updateData, { new: true });
  }

  async deleteProduct({ productId }: { productId: string }): Promise<void> {
    await Product.findByIdAndDelete(productId);
  }

  async getTopRatedProducts({
    limit = 3,
  }: {
    limit?: number;
  }): Promise<Array<TSelectProduct>> {
    return Product.find({}).sort({ rating: -1 }).limit(limit);
  }

  async getAllProducts(): Promise<Array<TSelectProduct>> {
    return Product.find({});
  }
}

export const productRepository = new ProductRepository();
