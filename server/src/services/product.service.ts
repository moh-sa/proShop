import type { IProductRepository } from "../repositories/index.js";
import type {
	AllProducts,
	InsertProductWithStringImage,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	ProductPaginationParams,
	Result,
	SelectProduct,
	TopRatedProduct,
} from "../types/index.js";

import {
	IMAGE_FIELD_NAME,
	MAX_TOP_RATED_PRODUCTS,
} from "../constants/index.js";
import { NotFoundError, ValidationError } from "../errors/index.js";
import { productRepository } from "../repositories/index.js";
import { insertProductSchema, selectImageSchema } from "../schemas/index.js";
import { getLoggerFromContext } from "../utils/index.js";
import {
	objectIdValidator,
	paginationParamsValidator,
} from "../validators/index.js";

export interface IProductService {
	create(
		data: InsertProductWithStringImage,
	): Promise<ProductResult<SelectProduct>>;
	delete(data: { productId: string }): Promise<ProductResult<void>>;
	getAll(
		args: ProductPaginationParams,
	): Promise<ProductResult<PaginatedResponse<AllProducts>>>;
	getById(data: { productId: string }): Promise<ProductResult<SelectProduct>>;
	getTopRated(): Promise<ProductResult<Array<TopRatedProduct>>>;
	update(data: {
		data: Partial<InsertProductWithStringImage>;
		productId: string;
	}): Promise<ProductResult<SelectProduct>>;
}
type ProductResult<T> = Result<T>;

export class ProductService implements IProductService {
	private readonly _repository: IProductRepository;

	constructor(repository?: IProductRepository) {
		this._repository = repository ?? productRepository;
	}

	public async create(
		data: MethodParams<IProductService, "create">,
	): MethodReturn<IProductService, "create"> {
		const logger = this._getLogger({ method: "create" });
		logger.debug({ data }, "Creating product");

		const validationResult = this._dataSchema().required().safeParse(data);
		if (!validationResult.success) {
			logger.warn({ error: validationResult.error }, "Invalid product data");
			return {
				error: new ValidationError("Invalid product data", {
					cause: validationResult.error,
				}),
				success: false,
			};
		}
		logger.debug(
			{ validatedData: validationResult.data },
			"Validated product data",
		);

		const createdProduct = await this._repository.create(validationResult.data);
		if (!createdProduct.success) {
			logger.error({ error: createdProduct.error }, "Failed to create product");
			return createdProduct;
		}

		return {
			data: createdProduct.data,
			success: true,
		};
	}

	public async delete({
		productId,
	}: MethodParams<IProductService, "delete">): MethodReturn<
		IProductService,
		"delete"
	> {
		const logger = this._getLogger({ method: "delete" });
		logger.debug({ productId }, "Deleting product");

		const validationResult = objectIdValidator.safeParse(productId);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error, productId },
				"Delete product validation failed",
			);
			return {
				error: new ValidationError("Invalid product id", {
					cause: validationResult.error,
				}),
				success: false,
			};
		}

		const deletedProduct = await this._repository.delete({
			productId: validationResult.data,
		});
		if (!deletedProduct.success) {
			logger.error({ error: deletedProduct.error }, "Failed to delete product");
			return deletedProduct;
		}
		if (!deletedProduct.data) {
			logger.warn({ productId }, "Product not found");
			return {
				error: new NotFoundError("Product"),
				success: false,
			};
		}

		return {
			data: undefined,
			success: true,
		};
	}

	public async getAll(
		args: MethodParams<IProductService, "getAll">,
	): MethodReturn<IProductService, "getAll"> {
		const logger = this._getLogger({ method: "getAll" });
		logger.debug({ args }, "Getting all products");

		const paginationResult = paginationParamsValidator.safeParse({
			pageNumber: args.pageNumber,
			pageSize: args.pageSize,
			sort: args.sort,
		});
		if (!paginationResult.success) {
			logger.warn({ error: paginationResult.error }, "Invalid pagination data");
			return {
				error: new ValidationError("Invalid pagination data", {
					cause: paginationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ paginationResult: paginationResult.data },
			"Validated pagination data",
		);

		const searchQuery =
			args.keyword &&
			typeof args.keyword === "string" &&
			args.keyword.trim().length > 0
				? { $text: { $search: args.keyword } }
				: {};

		logger.debug({ searchQuery }, "Search query");

		const result = await this._repository.getAll({
			pageNumber: paginationResult.data.pageNumber,
			pageSize: paginationResult.data.pageSize,
			pipeline: [
				{
					$project: {
						_id: 1,
						brand: 1,
						category: 1,
						image: 1,
						name: 1,
						price: 1,
						rating: 1,
					},
				},
			],
			query: searchQuery,
			sort: paginationResult.data.sort,
		});

		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to retrieve paginated products",
			);
			return result;
		}

		logger.info(
			{ totalProducts: result.data.meta.totalItems },
			"Products retrieved successfully",
		);

		return {
			data: {
				items: result.data.items,
				meta: result.data.meta,
			},
			success: true,
		};
	}

	public async getById({
		productId,
	}: MethodParams<IProductService, "getById">): MethodReturn<
		IProductService,
		"getById"
	> {
		const logger = this._getLogger({ method: "getById" });
		logger.debug({ productId }, "Getting product by ID");

		const validationResult = objectIdValidator.safeParse(productId);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error, productId },
				"Get product validation failed",
			);
			return {
				error: new ValidationError("Invalid product id", {
					cause: validationResult.error,
				}),
				success: false,
			};
		}

		const product = await this._repository.getById({
			productId: validationResult.data,
		});
		if (!product.success) {
			logger.error({ error: product.error }, "Failed to retrieve product");
			return product;
		}
		if (!product.data) {
			logger.warn({ productId }, "Product not found");
			return {
				error: new NotFoundError("Product"),
				success: false,
			};
		}

		logger.info({ productId }, "Product retrieved successfully");
		return {
			data: product.data,
			success: true,
		};
	}

	public async getTopRated(): MethodReturn<IProductService, "getTopRated"> {
		const logger = this._getLogger({ method: "getTopRated" });
		logger.debug("Getting top rated products");

		const limit = MAX_TOP_RATED_PRODUCTS;
		logger.debug({ limit }, "Limit for top rated products");

		const result = await this._repository.getTopRated({ limit });
		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to retrieve top rated products",
			);
			return result;
		}

		logger.info(
			{ totalProducts: result.data.length },
			"Top rated products retrieved successfully",
		);

		return {
			data: result.data,
			success: true,
		};
	}

	public async update(
		args: MethodParams<IProductService, "update">,
	): MethodReturn<IProductService, "update"> {
		const logger = this._getLogger({ method: "update" });
		logger.debug({ args }, "Updating product");

		const updateDataValidationResult = this._dataSchema()
			.partial()
			.safeParse(args.data);
		if (!updateDataValidationResult.success) {
			logger.warn(
				{ error: updateDataValidationResult.error, productId: args.productId },
				"Update product data validation failed",
			);
			return {
				error: new ValidationError("Invalid update data", {
					cause: updateDataValidationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedUpdateData: updateDataValidationResult.data },
			"Validated update data",
		);

		const productIdValidationResult = objectIdValidator.safeParse(
			args.productId,
		);
		if (!productIdValidationResult.success) {
			logger.warn(
				{ error: productIdValidationResult.error, productId: args.productId },
				"Product ID validation failed",
			);
			return {
				error: new ValidationError("Invalid product id", {
					cause: productIdValidationResult.error,
				}),
				success: false,
			};
		}

		const updatedProduct = await this._repository.update({
			data: updateDataValidationResult.data,
			productId: productIdValidationResult.data,
		});
		if (!updatedProduct.success) {
			logger.error({ error: updatedProduct.error }, "Failed to update product");
			return updatedProduct;
		}
		if (!updatedProduct.data) {
			logger.warn({ productId: args.productId }, "Product not found");
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

	private _dataSchema() {
		return insertProductSchema.omit({ [IMAGE_FIELD_NAME]: true }).extend({
			[IMAGE_FIELD_NAME]: selectImageSchema,
		});
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "product service", ...args });
	}
}

export const productService = new ProductService();
