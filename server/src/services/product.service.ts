import type { Types } from "mongoose";

import { z } from "zod";

import type { IProductRepository } from "../repositories/index.js";
import type { IImageStorageService } from "../services/index.js";
import type {
	AllProducts,
	InsertProduct,
	MethodParams,
	MethodReturn,
	Result,
	SelectProduct,
	TopRatedProduct,
} from "../types/index.js";

import { MAX_TOP_RATED_PRODUCTS } from "../constants/index.js";
import { NotFoundError, ValidationError } from "../errors/index.js";
import { ProductRepository } from "../repositories/index.js";
import { insertProductSchema } from "../schemas/index.js";
import { ImageStorageService } from "../services/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IProductService {
	create(data: InsertProduct): Promise<SelectProduct>;
	delete(data: { productId: string }): Promise<void>;
	getAll(data: { currentPage: string; keyword: string }): Promise<{
		currentPage: number;
		numberOfPages: number;
		products: Array<AllProducts>;
	}>;
	getById(data: { productId: string }): Promise<SelectProduct>;
	getTopRated(): Promise<Array<TopRatedProduct>>;
	update(data: {
		data: Partial<InsertProduct>;
		productId: string;
	}): Promise<SelectProduct>;
}
export type ProductResult<T> = Result<T>;

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

	async create(
		data: MethodParams<IProductService, "create">,
	): MethodReturn<IProductService, "create"> {
		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const image = await this._storage.upload({
			file: validationResult.data.image,
		});
		const dataWithImage = { ...validationResult.data, image };
		const createdProduct = await this._repository.create(dataWithImage);
		return createdProduct;
	}

	async delete({
		productId,
	}: MethodParams<IProductService, "delete">): MethodReturn<
		IProductService,
		"delete"
	> {
		const validationResult = this._validateProductId(productId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const deletedProduct = await this._repository.delete({
			productId: validationResult.data,
		});
		if (!deletedProduct) {
			throw new NotFoundError("Product");
		}

		await this._storage.delete({ url: deletedProduct.image });
	}

	async getAll(
		data: MethodParams<IProductService, "getAll">,
	): MethodReturn<IProductService, "getAll"> {
		const validationResult = this._validatePagination(data);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const currentPage = validationResult.data.currentPage;
		const query = validationResult.data.keyword;

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
	}: MethodParams<IProductService, "getById">): MethodReturn<
		IProductService,
		"getById"
	> {
		const validationResult = this._validateProductId(productId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const product = await this._repository.getById({
			productId: validationResult.data,
		});
		if (!product) {
			throw new NotFoundError("Product");
		}

		return product;
	}

	async getTopRated(): MethodReturn<IProductService, "getTopRated"> {
		const limit = MAX_TOP_RATED_PRODUCTS;
		return await this._repository.getTopRated({ limit });
	}

	async update(
		args: MethodParams<IProductService, "update">,
	): MethodReturn<IProductService, "update"> {
		const updateDataValidationResult = this._validateUpdateData(args.data);
		if (!updateDataValidationResult.success) {
			throw updateDataValidationResult.error;
		}

		const productIdValidationResult = this._validateProductId(args.productId);
		if (!productIdValidationResult.success) {
			throw productIdValidationResult.error;
		}

		const productId = productIdValidationResult.data;
		const { image, ...newData } = updateDataValidationResult.data;

		let updatedData;

		if (!image) {
			updatedData = { ...newData };
		} else {
			const currentProduct = await this.getById({
				productId: productId.toString(),
			});
			const newImageUrl = await this._storage.replace({
				file: image,
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

	private _validateCreateData(
		data: InsertProduct,
	): ProductResult<Required<InsertProduct>> {
		const result = insertProductSchema.required().safeParse(data);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid product data", {
					cause: result.error,
				}),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	private _validatePagination(data: {
		currentPage: string;
		keyword: string;
	}): ProductResult<{ currentPage: number; keyword: Record<string, unknown> }> {
		const result = z
			.object({
				currentPage: z.coerce.number().int().positive().default(1),
				keyword: z
					.string()
					.trim()
					.default("")
					.transform((val) =>
						val ? { name: { $options: "i", $regex: val } } : {},
					),
			})
			.safeParse(data);

		if (!result.success) {
			return {
				error: new ValidationError("Invalid pagination data", {
					cause: result.error,
				}),
				success: false,
			};
		}

		return { data: result.data, success: true };
	}

	private _validateProductId(productId: string): ProductResult<Types.ObjectId> {
		const result = objectIdValidator.safeParse(productId);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid product id", {
					cause: result.error,
				}),
				success: false,
			};
		}
		return { data: result.data, success: true };
	}

	private _validateUpdateData(
		data: Partial<InsertProduct>,
	): ProductResult<Partial<InsertProduct>> {
		const result = insertProductSchema.partial().safeParse(data);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid update data", {
					cause: result.error,
				}),
				success: false,
			};
		}
		return { data: result.data, success: true };
	}
}
