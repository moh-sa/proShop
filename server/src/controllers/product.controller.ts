import type { IProductManager } from "../managers/index.js";
import type {
	AllProducts,
	AsyncHandler,
	InsertProduct,
	PaginatedResponse,
	ProductPaginationParams,
	SafeSelectUser,
	SelectProduct,
	TopRatedProduct,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { ProductManager } from "../managers/index.js";
import {
	asyncHandler,
	fromCurrencySmallestUnit,
	getLoggerFromContext,
	toCurrencySmallestUnit,
} from "../utils/index.js";

export interface IProductController {
	create: AsyncHandler<{
		locals: { user: SafeSelectUser };
		reqBody: InsertProduct;
		resBody: { data: SelectProduct };
	}>;
	delete: AsyncHandler<{
		params: { productId: string };
		resBody: { data: null };
	}>;
	getAll: AsyncHandler<{
		query: ProductPaginationParams;
		resBody: {
			data: PaginatedResponse<AllProducts>["items"];
			meta: PaginatedResponse<AllProducts>["meta"];
		};
	}>;
	getById: AsyncHandler<{
		params: { productId: string };
		resBody: { data: SelectProduct };
	}>;
	getTopRated: AsyncHandler<{
		resBody: { data: Array<TopRatedProduct> };
	}>;
	update: AsyncHandler<{
		params: { productId: string };
		reqBody: Partial<InsertProduct>;
		resBody: { data: SelectProduct };
	}>;
}
export class ProductController implements IProductController {
	private readonly _manager: IProductManager;

	create = asyncHandler<{
		locals: { user: SafeSelectUser };
		reqBody: InsertProduct;
		resBody: { data: SelectProduct };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "create" });

		const dataToCreate = {
			...req.body,
			image: req.file,
			price: this._toCents(req.body.price),
			user: res.locals.user._id,
		};

		logger.debug({ data: dataToCreate }, "Creating product");

		const result = await this._manager.create(dataToCreate);
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ name: result.data.name, productId: result.data._id },
			"Product created successfully",
		);

		const dataToSend = { ...result.data };
		dataToSend.price = this._toDollars(result.data.price);

		res.status(HTTP_STATUS.CREATED).json({
			data: dataToSend,
			success: true,
		});
	});

	delete = asyncHandler<{
		params: { productId: string };
		resBody: { data: null };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "delete" });
		logger.debug({ productId: req.params.productId }, "Deleting product");

		const result = await this._manager.delete({
			productId: req.params.productId,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ productId: req.params.productId },
			"Product deleted successfully",
		);

		res.status(HTTP_STATUS.NO_CONTENT).json({
			data: null,
			success: true,
		});
	});

	getAll = asyncHandler<{
		query: ProductPaginationParams;
		resBody: {
			data: PaginatedResponse<AllProducts>["items"];
			meta: PaginatedResponse<AllProducts>["meta"];
		};
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getAll" });
		logger.debug({ query: req.query }, "Getting all products");

		const result = await this._manager.getAll(req.query);
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ totalProducts: result.data.meta.totalItems },
			"Products retrieved successfully",
		);

		const dataToSend = result.data.items.map((product) => {
			product.price = this._toDollars(product.price);
			return product;
		});

		res.status(HTTP_STATUS.OK).json({
			data: dataToSend,
			meta: result.data.meta,
			success: true,
		});
	});

	getById = asyncHandler<{
		params: { productId: string };
		resBody: { data: SelectProduct };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getById" });
		logger.debug({ productId: req.params.productId }, "Getting product by ID");

		const result = await this._manager.getById({
			productId: req.params.productId,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ productId: result.data._id },
			"Product retrieved by ID successfully",
		);

		const dataToSend = { ...result.data };
		dataToSend.price = this._toDollars(result.data.price);

		res.status(HTTP_STATUS.OK).json({
			data: dataToSend,
			success: true,
		});
	});

	getTopRated = asyncHandler<{
		resBody: { data: Array<TopRatedProduct> };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getTopRated" });
		logger.debug("Getting top rated products");

		const result = await this._manager.getTopRated();
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ totalProducts: result.data.length },
			"Top rated products retrieved successfully",
		);

		const dataToSend = result.data.map((product) => {
			product.price = this._toDollars(product.price);
			return product;
		});

		res.status(HTTP_STATUS.OK).json({
			data: dataToSend,
			success: true,
		});
	});

	update = asyncHandler<{
		params: { productId: string };
		reqBody: Partial<InsertProduct>;
		resBody: { data: SelectProduct };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "update" });

		const dataToUpdate = {
			...req.body,
			image: req.file,
		};

		if (req.body.price !== undefined) {
			dataToUpdate.price = this._toCents(req.body.price);
		}

		logger.debug({ data: dataToUpdate }, "Updating product");

		const result = await this._manager.update({
			data: dataToUpdate,
			productId: req.params.productId,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ name: result.data.name, productId: result.data._id },
			"Product updated successfully",
		);

		const dataToSend = { ...result.data };
		dataToSend.price = this._toDollars(result.data.price);

		res.status(HTTP_STATUS.OK).json({
			data: dataToSend,
			success: true,
		});
	});

	constructor(manager: IProductManager = new ProductManager()) {
		this._manager = manager;
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({
			layer: "product controller",
			...args,
		});
	}

	private _toCents(amount: number): number {
		return toCurrencySmallestUnit({
			amount,
			currency: "USD",
		});
	}

	private _toDollars(amount: number): number {
		return fromCurrencySmallestUnit({
			amount,
			currency: "USD",
		});
	}
}
