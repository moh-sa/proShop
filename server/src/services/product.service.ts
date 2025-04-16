import { Types } from "mongoose";
import { NotFoundError } from "../errors";
import { IImageStorageManager, ImageStorageManager } from "../managers";
import { IProductRepository, ProductRepository } from "../repositories";
import {
  AllProducts,
  InsertProduct,
  SelectProduct,
  TopRatedProduct,
} from "../types";

export interface IProductService {
  getById(data: { productId: Types.ObjectId }): Promise<SelectProduct>;
  getAll(data: { keyword: string; currentPage: number }): Promise<{
    products: Array<AllProducts>;
    currentPage: number;
    numberOfPages: number;
  }>;
  getTopRated(): Promise<Array<TopRatedProduct>>;
  create(data: InsertProduct): Promise<SelectProduct>;
  update(data: {
    productId: Types.ObjectId;
    data: Partial<InsertProduct>;
  }): Promise<SelectProduct>;
  delete(data: { productId: Types.ObjectId }): Promise<void>;
}

export class ProductService implements IProductService {
  private readonly repository: IProductRepository;
  private readonly storage: IImageStorageManager;

  constructor(
    repository: IProductRepository = new ProductRepository(),
    storage: IImageStorageManager = new ImageStorageManager(),
  ) {
    this.repository = repository;
    this.storage = storage;
  }

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
    const image = await this.storage.upload({ file: data.image });
    const dataWithImage = { ...data, image };
    const createdProduct = await this.repository.create(dataWithImage);
    return createdProduct;
  }

  async update({
    productId,
    data,
  }: {
    productId: Types.ObjectId;
    data: Partial<
      Omit<InsertProduct, "image"> & { image: InsertProduct["image"] }
    >;
  }): Promise<SelectProduct> {
    const { image, ...newData } = data;
    let updatedData;

    if (!data.image) {
      updatedData = { ...newData };
    } else {
      const currentProduct = await this.getById({ productId });
      const newImageUrl = await this.storage.replace({
        url: currentProduct.image,
        file: data.image,
      });
      updatedData = { ...newData, image: newImageUrl };
    }

    const updatedProduct = await this.repository.update({
      productId,
      data: updatedData,
    });
    if (!updatedProduct) throw new NotFoundError("Product");

    return updatedProduct;
  }

  async delete({ productId }: { productId: Types.ObjectId }): Promise<void> {
    const deletedProduct = await this.repository.delete({ productId });
    await this.storage.delete({ url: deletedProduct.image });
  }
}
