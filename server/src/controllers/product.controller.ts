import { z } from "zod";

import type { IProductService } from "../services/index.js";
import type {
	AllProducts,
	InsertProduct,
	SelectProduct,
	StrictAsyncHandler,
	TopRatedProduct,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { insertProductSchema } from "../schemas/index.js";
import { ProductService } from "../services/index.js";
import {
	removeEmptyFieldsSchema,
	sendSuccessResponse,
	strictAsyncHandler,
} from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IProductController {
	create: StrictAsyncHandler<{
		reqBody: InsertProduct;
		resBody: { data: SelectProduct };
	}>;
	delete: StrictAsyncHandler<{
		params: { productId: string };
		resBody: { data: null };
	}>;
	getAll: StrictAsyncHandler<{
		query: {
			currentPage: string;
			keyword: string;
		};
		resBody: {
			data: Array<AllProducts>;
			meta: {
				currentPage: number;
				numberOfPages: number;
			};
		};
	}>;
	getById: StrictAsyncHandler<{
		params: { productId: string };
		resBody: { data: SelectProduct };
	}>;
	getTopRated: StrictAsyncHandler<{
		resBody: { data: Array<TopRatedProduct> };
	}>;
	update: StrictAsyncHandler<{
		params: { productId: string };
		reqBody: Partial<InsertProduct>;
		resBody: { data: SelectProduct };
	}>;
}
export class ProductController implements IProductController {
	private readonly _service: IProductService;

	create = strictAsyncHandler<{
		reqBody: InsertProduct;
		resBody: { data: SelectProduct };
	}>(async (req, res) => {
		const data = insertProductSchema.parse({
			...req.body,
			image: req.file,
			user: res.locals.user._id,
		});

		const newProduct = await this._service.create(data);

		return sendSuccessResponse({
			data: newProduct,
			responseContext: res,
			statusCode: HTTP_STATUS.CREATED,
		});
	});

	delete = strictAsyncHandler<{
		params: { productId: string };
		resBody: { data: null };
	}>(async (req, res) => {
		const productId = objectIdValidator.parse(req.params.productId);

		await this._service.delete({ productId });

		return sendSuccessResponse({
			data: null,
			responseContext: res,
			statusCode: HTTP_STATUS.NO_CONTENT,
		});
	});

	getAll = strictAsyncHandler<{
		query: {
			currentPage: string;
			keyword: string;
		};
		resBody: {
			data: Array<AllProducts>;
			meta: {
				currentPage: number;
				numberOfPages: number;
			};
		};
	}>(async (req, res) => {
		const query = z
			.object({
				currentPage: z.coerce.number().int().positive().default(1),
				keyword: z.string().default(""),
			})
			.parse(req.query);

		const data = await this._service.getAll(query);

		return sendSuccessResponse({
			data: data.products,
			meta: {
				currentPage: data.currentPage,
				numberOfPages: data.numberOfPages,
			},
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	getById = strictAsyncHandler<{
		params: { productId: string };
		resBody: { data: SelectProduct };
	}>(async (req, res) => {
		const productId = objectIdValidator.parse(req.params.productId);

		const product = await this._service.getById({ productId });

		return sendSuccessResponse({
			data: product,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	getTopRated = strictAsyncHandler<{
		resBody: { data: Array<TopRatedProduct> };
	}>(async (req, res) => {
		const products = await this._service.getTopRated();

		return sendSuccessResponse({
			data: products,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	update = strictAsyncHandler<{
		params: { productId: string };
		reqBody: Partial<InsertProduct>;
		resBody: { data: SelectProduct };
	}>(async (req, res) => {
		const productId = objectIdValidator.parse(req.params.productId);
		const data = removeEmptyFieldsSchema(insertProductSchema.partial()).parse({
			...req.body,
			image: req.file,
		});

		const updatedProduct = await this._service.update({
			data,
			productId,
		});

		return sendSuccessResponse({
			data: updatedProduct,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	constructor(service: IProductService = new ProductService()) {
		this._service = service;
	}
}
