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
import { asyncHandler, getLoggerFromContext } from "../utils/index.js";

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

		const data = {
			...req.body,
			image: req.file,
			user: res.locals.user._id,
		};
		logger.debug({ data }, "Creating product");

		const result = await this._manager.create(data);
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ name: result.data.name, productId: result.data._id },
			"Product created successfully",
		);

		res.status(HTTP_STATUS.CREATED).json({
			data: result.data,
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

		res.status(HTTP_STATUS.OK).json({
			data: result.data.items,
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

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
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

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	update = asyncHandler<{
		params: { productId: string };
		reqBody: Partial<InsertProduct>;
		resBody: { data: SelectProduct };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "update" });

		const data = {
			...req.body,
			image: req.file,
		};
		logger.debug({ data }, "Updating product");

		const result = await this._manager.update({
			data,
			productId: req.params.productId,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ name: result.data.name, productId: result.data._id },
			"Product updated successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
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
}
