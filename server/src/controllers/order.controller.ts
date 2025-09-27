import type { IOrderService } from "../services/index.js";
import type {
	AllOrdersResponse,
	InsertOrder,
	SelectOrder,
	StrictAsyncHandler,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { insertOrderSchema } from "../schemas/index.js";
import { OrderService } from "../services/index.js";
import { sendSuccessResponse, strictAsyncHandler } from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IOrderController {
	create: StrictAsyncHandler<{
		reqBody: InsertOrder;
		resBody: { data: SelectOrder };
	}>;
	getAll: StrictAsyncHandler<{
		resBody: { data: AllOrdersResponse };
	}>;
	getAllByUserId: StrictAsyncHandler<{
		params: { userId: string };
		resBody: { data: AllOrdersResponse };
	}>;
	getById: StrictAsyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>;
	updateToDelivered: StrictAsyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>;
	updateToPaid: StrictAsyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>;
}
export class OrderController implements IOrderController {
	private readonly _service: IOrderService;

	create = strictAsyncHandler<{
		reqBody: InsertOrder;
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const data = insertOrderSchema.parse({
			...req.body,
			user: res.locals.user._id,
		});

		const response = await this._service.create(data);

		return sendSuccessResponse({
			data: response,
			responseContext: res,
			statusCode: HTTP_STATUS.CREATED,
		});
	});

	getAll = strictAsyncHandler<{
		resBody: { data: AllOrdersResponse };
	}>(async (req, res) => {
		const orders = await this._service.getAll();

		return sendSuccessResponse({
			data: orders,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	getAllByUserId = strictAsyncHandler<{
		params: { userId: string };
		resBody: { data: AllOrdersResponse };
	}>(async (req, res) => {
		const userId = objectIdValidator.parse(req.params.userId);

		const orders = await this._service.getAllByUserId({ userId });

		return sendSuccessResponse({
			data: orders,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	getById = strictAsyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const orderId = objectIdValidator.parse(req.params.orderId);

		const order = await this._service.getById({ orderId });

		return sendSuccessResponse({
			data: order,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	updateToDelivered = strictAsyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const orderId = objectIdValidator.parse(req.params.orderId);

		const order = await this._service.updateToDelivered({ orderId });

		return sendSuccessResponse({
			data: order,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	updateToPaid = strictAsyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const orderId = objectIdValidator.parse(req.params.orderId);

		const order = await this._service.updateToPaid({ orderId });

		return sendSuccessResponse({
			data: order,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	constructor(service: IOrderService = new OrderService()) {
		this._service = service;
	}
}
