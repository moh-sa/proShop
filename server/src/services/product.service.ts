import { Types } from "mongoose";
import { NotFoundError } from "../errors";
import { productRepository } from "../repositories";
import {
  AllProducts,
  InsertProduct,
  SelectProduct,
  TopRatedProduct,
} from "../types";

class ProductService {
  private readonly repository = productRepository;

  async getById({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<SelectProduct> {
    const product = await this.repository.getById({ productId });
    if (!product) throw new NotFoundError("Product");

    return product;
  }

  async getAll(data: { keyword: string; currentPage: number }): Promise<{
    products: Array<AllProducts>;
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

    const products = await this.repository.getAll({
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

  async getTopRated(): Promise<Array<TopRatedProduct>> {
    return await this.repository.getTopRated({});
  }

  async create(data: InsertProduct): Promise<SelectProduct> {
    return await this.repository.create({ productData: data });
  }

  async update({
    productId,
    updateData,
  }: {
    productId: Types.ObjectId;
    updateData: Partial<InsertProduct>;
  }): Promise<SelectProduct> {
    const updatedProduct = await this.repository.update({
      productId,
      updateData,
    });
    if (!updatedProduct) throw new NotFoundError("Product");

    return updatedProduct;
  }

  async delete({ productId }: { productId: Types.ObjectId }): Promise<void> {
    await this.repository.delete({ productId });
  }
}

export const productService = new ProductService();
