import { MAX_TOP_RATED_PRODUCTS } from "../constants/index.js";
import { NotFoundError, ValidationError } from "../errors/index.js";
import type { IProductRepository } from "../repositories/index.js";
import { productRepository } from "../repositories/index.js";
import {
	createProductSchema,
	productPaginationParamsSchema,
	updateProductSchema,
} from "../schemas/index.js";
import type {
	AllProducts,
	CreateProductInput,
	GetAllProductsServiceParams,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	Product,
	ProductSelect,
	Result,
	TopRatedProduct,
	UpdateProductInput,
} from "../types/index.js";
import { getLoggerFromContext } from "../utils/index.js";
import { objectIdStringValidator } from "../validators/index.js";

export interface IProductService {
	create(data: CreateProductInput): Promise<ProductResult<Product>>;
	delete(data: { productId: string }): Promise<ProductResult<void>>;
	getAll(
		args: GetAllProductsServiceParams,
	): Promise<ProductResult<PaginatedResponse<AllProducts>>>;
	getById(data: { productId: string }): Promise<ProductResult<Product>>;
	getTopRated(): Promise<ProductResult<Array<TopRatedProduct>>>;
	update(data: {
		data: UpdateProductInput;
		productId: string;
	}): Promise<ProductResult<Product>>;
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

		const validationResult = createProductSchema.safeParse(data);
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

		const validationResult = objectIdStringValidator.safeParse(productId);
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

		// validate arguments
		const paginationValidationResult =
			productPaginationParamsSchema.safeParse(args);
		if (!paginationValidationResult.success) {
			logger.warn(paginationValidationResult.error, "Invalid pagination data");
			return {
				error: new ValidationError("Invalid pagination data", {
					cause: paginationValidationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ paginationResult: paginationValidationResult.data },
			"Validated pagination data",
		);

		// call repository
		const selectedFields: ProductSelect = {
			brand: true,
			category: true,
			id: true,
			image: true,
			name: true,
			price: true,
			rating: true,
			countInStock: true,
		};

		const result = await this._repository.getAll({
			...paginationValidationResult.data,
			select: selectedFields,
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

		const validationResult = objectIdStringValidator.safeParse(productId);
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

		const updateDataValidationResult = updateProductSchema.safeParse(args.data);
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

		const productIdValidationResult = objectIdStringValidator.safeParse(
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

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "product service", ...args });
	}
}

export const productService = new ProductService();
