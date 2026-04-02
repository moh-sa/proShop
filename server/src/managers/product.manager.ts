import type {
	IImageStorageService,
	IProductService,
} from "../services/index.js";
import type {
	AllProducts,
	GetAllProductsManagerParams,
	InsertProduct,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	Result,
	SelectProduct,
	TopRatedProduct,
} from "../types/index.js";

import { ValidationError } from "../errors/index.js";
import { imageStorageService, productService } from "../services/index.js";
import { getLoggerFromContext } from "../utils/index.js";

export interface IProductManager {
	create(data: InsertProduct): Promise<ProductManagerResult<SelectProduct>>;
	delete(data: { productId: string }): Promise<ProductManagerResult<void>>;
	getAll(
		args: GetAllProductsManagerParams,
	): Promise<ProductManagerResult<PaginatedResponse<AllProducts>>>;
	getById(data: {
		productId: string;
	}): Promise<ProductManagerResult<SelectProduct>>;
	getTopRated(): Promise<ProductManagerResult<Array<TopRatedProduct>>>;
	update(data: {
		data: Partial<InsertProduct>;
		productId: string;
	}): Promise<ProductManagerResult<SelectProduct>>;
}

type ProductManagerResult<T> = Result<T>;

export class ProductManager implements IProductManager {
	private readonly _imageStorage: IImageStorageService;
	private readonly _productService: IProductService;

	constructor(product?: IProductService, imageStorage?: IImageStorageService) {
		this._productService = product ?? productService;
		this._imageStorage = imageStorage ?? imageStorageService;
	}

	public async create(
		data: MethodParams<IProductManager, "create">,
	): MethodReturn<IProductManager, "create"> {
		const logger = this._getLogger({ method: "create" });
		logger.debug({ data }, "Creating product with image");

		if (!data.image) {
			logger.warn("No image provided for product creation");
			return {
				error: new ValidationError("Product image is required"),
				success: false,
			};
		}
		logger.info("Uploading product image");

		const imageResult = await this._imageStorage.upload({
			file: data.image,
		});
		if (!imageResult.success) {
			return imageResult;
		}

		logger.info({ imageUrl: imageResult.data }, "Image uploaded successfully");

		const result = await this._productService.create({
			...data,
			image: imageResult.data,
		});
		if (!result.success) {
			return result;
		}

		logger.info(
			{ name: result.data.name, productId: result.data._id },
			"Product created successfully",
		);
		return result;
	}

	public async delete(
		data: MethodParams<IProductManager, "delete">,
	): MethodReturn<IProductManager, "delete"> {
		const logger = this._getLogger({ method: "delete" });
		logger.debug({ productId: data.productId }, "Deleting product with image");

		const currentProduct = await this._productService.getById({
			productId: data.productId,
		});
		if (!currentProduct.success) {
			return currentProduct;
		}

		const deleteResult = await this._productService.delete({
			productId: data.productId,
		});
		if (!deleteResult.success) {
			return deleteResult;
		}

		logger.info(
			{ imageUrl: currentProduct.data.image, productId: data.productId },
			"Deleting product image",
		);

		const imageDeleteResult = await this._imageStorage.delete({
			url: currentProduct.data.image,
		});
		if (!imageDeleteResult.success) {
			return imageDeleteResult;
		}

		logger.info({ productId: data.productId }, "Product deleted successfully");
		return deleteResult;
	}

	public async getAll(
		args: MethodParams<IProductManager, "getAll">,
	): MethodReturn<IProductManager, "getAll"> {
		return this._productService.getAll(args);
	}

	public async getById(
		data: MethodParams<IProductManager, "getById">,
	): MethodReturn<IProductManager, "getById"> {
		return this._productService.getById(data);
	}

	public async getTopRated(): MethodReturn<IProductManager, "getTopRated"> {
		return this._productService.getTopRated();
	}

	public async update(
		args: MethodParams<IProductManager, "update">,
	): MethodReturn<IProductManager, "update"> {
		const logger = this._getLogger({ method: "update" });
		logger.debug({ args }, "Updating product");

		const { image, ...productData } = args.data;

		if (!image) {
			logger.info("No image provided, updating product data only");
			return this._productService.update({
				data: productData,
				productId: args.productId,
			});
		}

		logger.info("Image update requested");
		const currentProduct = await this._productService.getById({
			productId: args.productId,
		});
		if (!currentProduct.success) {
			return currentProduct;
		}

		logger.info(
			{ oldImageUrl: currentProduct.data.image, productId: args.productId },
			"Replacing product image",
		);
		const newImageResult = await this._imageStorage.replace({
			file: image,
			url: currentProduct.data.image,
		});
		if (!newImageResult.success) {
			return newImageResult;
		}

		logger.info(
			{ newImageUrl: newImageResult.data, productId: args.productId },
			"Product image replaced successfully",
		);

		const updateResult = await this._productService.update({
			data: { ...productData, image: newImageResult.data },
			productId: args.productId,
		});
		if (!updateResult.success) {
			return updateResult;
		}

		logger.info(
			{ name: updateResult.data.name, productId: args.productId },
			"Product updated successfully",
		);
		return updateResult;
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "product manager", ...args });
	}
}

export const productManager = new ProductManager();
