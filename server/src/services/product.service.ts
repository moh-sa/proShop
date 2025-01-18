import mongoose, { Document, Types } from "mongoose";
import { productRepository } from "../repositories";
import {
  SelectUser,
  TInsertProduct,
  TSelectProduct,
  TSelectReview,
} from "../types";

class ProductService {
  private readonly repository = productRepository;

  async getById({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<TSelectProduct> {
    const product = await this.repository.getProductById({ productId });
    if (!product) throw new Error("Product not found.");

    return product;
  }

  async getAll(data: { keyword: string; currentPage: number }): Promise<{
    products: Array<TSelectProduct>;
    currentPage: number;
    numberOfPages: number;
  }> {
    const currentPage = data.currentPage || 1;

    const query = data.keyword
      ? { name: { $regex: data.keyword, $options: "i" } }
      : {};

    const numberOfProductsPerPage = 10;
    const numberOfProducts = await this.repository.count(query);
    const numberOfPages = Math.ceil(numberOfProducts / numberOfProductsPerPage);

    const products = await this.repository.getAllProducts({
      query,
      numberOfProductsPerPage,
      currentPage,
    });

    return {
      products,
      currentPage,
      numberOfPages,
    };
  }

  async getTopRated(): Promise<Array<TSelectProduct>> {
    return await this.repository.getTopRatedProducts({});
  }

  async create(data: TInsertProduct): Promise<TSelectProduct> {
    return this.repository.createProduct({ productData: data });
  }

  async createReview(data: {
    user: SelectUser;
    productId: Types.ObjectId;
    rating: number;
    comment: string;
  }): Promise<void> {
    // TODO: check the best way to do this type union.
    const product = (await this.repository.getProductById({
      productId: data.productId,
    })) as unknown as TSelectProduct & Document;
    if (!product) throw new Error("Product not found.");

    // TODO: create a review model
    const review: TSelectReview = {
      _id: new mongoose.Types.ObjectId(),
      name: data.user.name,
      rating: Number(data.rating),
      comment: data.comment,
      user: data.user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    product.reviews.push(review);

    const numberOfReviews = product.reviews.length;
    const totalRating = product.reviews.reduce(
      (acc, item) => item.rating + acc,
      0,
    );
    const averageRating = totalRating / numberOfReviews;

    product.numReviews = numberOfReviews;
    product.rating = averageRating;
    await product.save();
  }

  async update({
    productId,
    updateData,
  }: {
    productId: Types.ObjectId;
    updateData: Partial<TInsertProduct>;
  }): Promise<TSelectProduct> {
    const updatedProduct = await this.repository.updateProduct({
      productId,
      updateData,
    });
    if (!updatedProduct) throw new Error("Product not found.");
    return updatedProduct;
  }

  async delete({ productId }: { productId: Types.ObjectId }): Promise<void> {
    await this.repository.deleteProduct({ productId });
  }

  async isReviewedByUser({
    productId,
    userId,
  }: {
    productId: Types.ObjectId;
    userId: Types.ObjectId;
  }): Promise<{ _id: Types.ObjectId } | null> {
    return this.repository.reviewByUserExists({ productId, userId });
  }
}

export const productService = new ProductService();
