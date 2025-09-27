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
import { removeEmptyFieldsSchema, strictAsyncHandler } from "../utils/index.js";
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

		res.status(HTTP_STATUS.CREATED).json({
			data: newProduct,
			success: true,
		});
	});

	delete = strictAsyncHandler<{
		params: { productId: string };
		resBody: { data: null };
	}>(async (req, res) => {
		const productId = objectIdValidator.parse(req.params.productId);

		await this._service.delete({ productId });

		res.status(HTTP_STATUS.NO_CONTENT).json({
			data: null,
			success: true,
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

		res.status(HTTP_STATUS.OK).json({
			data: data.products,
			meta: {
				currentPage: data.currentPage,
				numberOfPages: data.numberOfPages,
			},
			success: true,
		});
	});

	getById = strictAsyncHandler<{
		params: { productId: string };
		resBody: { data: SelectProduct };
	}>(async (req, res) => {
		const productId = objectIdValidator.parse(req.params.productId);

		const product = await this._service.getById({ productId });

		res.status(HTTP_STATUS.OK).json({
			data: product,
			success: true,
		});
	});

	getTopRated = strictAsyncHandler<{
		resBody: { data: Array<TopRatedProduct> };
	}>(async (req, res) => {
		const products = await this._service.getTopRated();

		res.status(HTTP_STATUS.OK).json({
			data: products,
			success: true,
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

		res.status(HTTP_STATUS.OK).json({
			data: updatedProduct,
			success: true,
		});
	});

	constructor(service: IProductService = new ProductService()) {
		this._service = service;
	}
}
