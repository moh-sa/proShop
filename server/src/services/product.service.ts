import type { Types } from "mongoose";

import type { IProductRepository } from "../repositories/index.js";
import type { IImageStorageService } from "../services/index.js";
import type {
	AllProducts,
	InsertProduct,
	SelectProduct,
	TopRatedProduct,
} from "../types/index.js";

import { MAX_TOP_RATED_PRODUCTS } from "../constants/index.js";
import { NotFoundError } from "../errors/index.js";
import { ProductRepository } from "../repositories/index.js";
import { ImageStorageService } from "../services/index.js";

export interface IProductService {
	create(data: InsertProduct): Promise<SelectProduct>;
	delete(data: { productId: Types.ObjectId }): Promise<void>;
	getAll(data: { currentPage: number; keyword: string }): Promise<{
		currentPage: number;
		numberOfPages: number;
		products: Array<AllProducts>;
	}>;
	getById(data: { productId: Types.ObjectId }): Promise<SelectProduct>;
	getTopRated(): Promise<Array<TopRatedProduct>>;
	update(data: {
		data: Partial<InsertProduct>;
		productId: Types.ObjectId;
	}): Promise<SelectProduct>;
}

export class ProductService implements IProductService {
	private readonly _repository: IProductRepository;
	private readonly _storage: IImageStorageService;

	constructor(
		repository: IProductRepository = new ProductRepository(),
		storage: IImageStorageService = new ImageStorageService(),
	) {
		this._repository = repository;
		this._storage = storage;
	}

	async create(data: InsertProduct): Promise<SelectProduct> {
		const image = await this._storage.upload({ file: data.image });
		const dataWithImage = { ...data, image };
		const createdProduct = await this._repository.create(dataWithImage);
		return createdProduct;
	}

	async delete({ productId }: { productId: Types.ObjectId }): Promise<void> {
		const deletedProduct = await this._repository.delete({ productId });
		if (!deletedProduct) {
			throw new NotFoundError("Product");
		}

		await this._storage.delete({ url: deletedProduct.image });
	}

	async getAll(data: { currentPage: number; keyword: string }): Promise<{
		currentPage: number;
		numberOfPages: number;
		products: Array<AllProducts>;
	}> {
		const currentPage = data.currentPage || 1;

		const query = data.keyword
			? { name: { $options: "i", $regex: data.keyword } }
			: {};

		const numberOfProductsPerPage = 10;
		const numberOfProducts = await this._repository.count(query);
		const numberOfPages =
			Math.ceil(numberOfProducts / numberOfProductsPerPage) || 1;

		const products = await this._repository.getAll({
			currentPage,
			numberOfProductsPerPage,
			query,
		});

		return {
			currentPage,
			numberOfPages,
			products,
		};
	}

	async getById({
		productId,
	}: {
		productId: Types.ObjectId;
	}): Promise<SelectProduct> {
		const product = await this._repository.getById({ productId });
		if (!product) {
			throw new NotFoundError("Product");
		}

		return product;
	}

	async getTopRated(): Promise<Array<TopRatedProduct>> {
		const limit = MAX_TOP_RATED_PRODUCTS;
		return await this._repository.getTopRated({ limit });
	}

	async update({
		data,
		productId,
	}: {
		data: Partial<
			Omit<InsertProduct, "image"> & { image: InsertProduct["image"] }
		>;
		productId: Types.ObjectId;
	}): Promise<SelectProduct> {
		const { image: _image, ...newData } = data;
		let updatedData;

		if (!data.image) {
			updatedData = { ...newData };
		} else {
			const currentProduct = await this.getById({ productId });
			const newImageUrl = await this._storage.replace({
				file: data.image,
				url: currentProduct.image,
			});
			updatedData = { ...newData, image: newImageUrl };
		}

		const updatedProduct = await this._repository.update({
			data: updatedData,
			productId,
		});
		if (!updatedProduct) {
			throw new NotFoundError("Product");
		}

		return updatedProduct;
	}
}
