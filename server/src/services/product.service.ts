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
	create(data: InsertProduct): Promise<ProductResult<SelectProduct>>;
	delete(data: { productId: string }): Promise<ProductResult<void>>;
	getAll(data: { currentPage: string; keyword: string }): Promise<
		ProductResult<{
			currentPage: number;
			numberOfPages: number;
			products: Array<AllProducts>;
		}>
	>;
	getById(data: { productId: string }): Promise<ProductResult<SelectProduct>>;
	getTopRated(): Promise<ProductResult<Array<TopRatedProduct>>>;
	update(data: {
		data: Partial<InsertProduct>;
		productId: string;
	}): Promise<ProductResult<SelectProduct>>;
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
			return validationResult;
		}

		const image = await this._storage.upload({
			file: validationResult.data.image,
		});
		if (!image.success) {
			return image;
		}
		const dataWithImage = { ...validationResult.data, image: image.data };
		const createdProduct = await this._repository.create(dataWithImage);
		if (!createdProduct.success) {
			return createdProduct;
		}

		return {
			data: createdProduct.data,
			success: true,
		};
	}

	async delete({
		productId,
	}: MethodParams<IProductService, "delete">): MethodReturn<
		IProductService,
		"delete"
	> {
		const validationResult = this._validateProductId(productId);
		if (!validationResult.success) {
			return validationResult;
		}

		const deletedProduct = await this._repository.delete({
			productId: validationResult.data,
		});
		if (!deletedProduct.success) {
			return deletedProduct;
		}
		if (!deletedProduct.data) {
			return {
				error: new NotFoundError("Product"),
				success: false,
			};
		}

		const deleteResult = await this._storage.delete({
			url: deletedProduct.data.image,
		});
		if (!deleteResult.success) {
			return deleteResult;
		}

		return {
			data: undefined,
			success: true,
		};
	}

	async getAll(
		data: MethodParams<IProductService, "getAll">,
	): MethodReturn<IProductService, "getAll"> {
		const validationResult = this._validatePagination(data);
		if (!validationResult.success) {
			return validationResult;
		}

		const currentPage = validationResult.data.currentPage;
		const query = validationResult.data.keyword;

		const numberOfProductsPerPage = 10;
		const numberOfProducts = await this._repository.count(query);
		if (!numberOfProducts.success) {
			return numberOfProducts;
		}

		const numberOfPages =
			Math.ceil(numberOfProducts.data / numberOfProductsPerPage) || 1;

		const products = await this._repository.getAll({
			currentPage,
			numberOfProductsPerPage,
			query,
		});
		if (!products.success) {
			return products;
		}

		return {
			data: {
				currentPage,
				numberOfPages,
				products: products.data,
			},
			success: true,
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
			return validationResult;
		}

		const product = await this._repository.getById({
			productId: validationResult.data,
		});
		if (!product.success) {
			return product;
		}
		if (!product.data) {
			return {
				error: new NotFoundError("Product"),
				success: false,
			};
		}

		return {
			data: product.data,
			success: true,
		};
	}

	async getTopRated(): MethodReturn<IProductService, "getTopRated"> {
		const limit = MAX_TOP_RATED_PRODUCTS;

		const result = await this._repository.getTopRated({ limit });
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async update(
		args: MethodParams<IProductService, "update">,
	): MethodReturn<IProductService, "update"> {
		const updateDataValidationResult = this._validateUpdateData(args.data);
		if (!updateDataValidationResult.success) {
			return updateDataValidationResult;
		}

		const productIdValidationResult = this._validateProductId(args.productId);
		if (!productIdValidationResult.success) {
			return productIdValidationResult;
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
			if (!currentProduct.success) {
				return currentProduct;
			}

			const newImageUrl = await this._storage.replace({
				file: image,
				url: currentProduct.data.image,
			});
			if (!newImageUrl.success) {
				return newImageUrl;
			}
			updatedData = { ...newData, image: newImageUrl.data };
		}

		const updatedProduct = await this._repository.update({
			data: updatedData,
			productId,
		});
		if (!updatedProduct.success) {
			return updatedProduct;
		}
		if (!updatedProduct.data) {
			return {
				error: new NotFoundError("Product"),
				success: false,
			};
		}

		return {
			data: updatedProduct.data,
			success: true,
		};
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
