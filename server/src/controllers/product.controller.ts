import type { IProductService } from "../services/index.js";
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
import { ProductService } from "../services/index.js";
import { asyncHandler } from "../utils/index.js";

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
	private readonly _service: IProductService;

	create = asyncHandler<{
		locals: { user: SafeSelectUser };
		reqBody: InsertProduct;
		resBody: { data: SelectProduct };
	}>(async (req, res) => {
		const data = {
			...req.body,
			image: req.file,
			user: res.locals.user._id,
		};

		const result = await this._service.create(data);
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.CREATED).json({
			data: result.data,
			success: true,
		});
	});

	delete = asyncHandler<{
		params: { productId: string };
		resBody: { data: null };
	}>(async (req, res) => {
		const result = await this._service.delete({
			productId: req.params.productId,
		});
		if (!result.success) {
			throw result.error;
		}

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
		const result = await this._service.getAll(req.query);
		if (!result.success) {
			throw result.error;
		}

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
		const result = await this._service.getById({
			productId: req.params.productId,
		});
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	getTopRated = asyncHandler<{
		resBody: { data: Array<TopRatedProduct> };
	}>(async (req, res) => {
		const result = await this._service.getTopRated();
		if (!result.success) {
			throw result.error;
		}

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
		const data = {
			...req.body,
			image: req.file,
		};

		const result = await this._service.update({
			data,
			productId: req.params.productId,
		});
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	constructor(service: IProductService = new ProductService()) {
		this._service = service;
	}
}
