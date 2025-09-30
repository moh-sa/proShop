import type { IOrderService } from "../services/index.js";
import type {
	AllOrdersResponse,
	AsyncHandler,
	InsertOrder,
	SelectOrder,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { OrderService } from "../services/index.js";
import { asyncHandler } from "../utils/index.js";

export interface IOrderController {
	create: AsyncHandler<{
		reqBody: InsertOrder;
		resBody: { data: SelectOrder };
	}>;
	getAll: AsyncHandler<{
		resBody: { data: AllOrdersResponse };
	}>;
	getAllByUserId: AsyncHandler<{
		params: { userId: string };
		resBody: { data: AllOrdersResponse };
	}>;
	getById: AsyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>;
	updateToDelivered: AsyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>;
	updateToPaid: AsyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>;
}
export class OrderController implements IOrderController {
	private readonly _service: IOrderService;

	create = asyncHandler<{
		reqBody: InsertOrder;
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const data = {
			...req.body,
			user: res.locals.user._id,
		};

		const response = await this._service.create(data);

		res.status(HTTP_STATUS.CREATED).json({
			data: response,
			success: true,
		});
	});

	getAll = asyncHandler<{
		resBody: { data: AllOrdersResponse };
	}>(async (req, res) => {
		const orders = await this._service.getAll();

		res.status(HTTP_STATUS.OK).json({
			data: orders,
			success: true,
		});
	});

	getAllByUserId = asyncHandler<{
		params: { userId: string };
		resBody: { data: AllOrdersResponse };
	}>(async (req, res) => {
		const orders = await this._service.getAllByUserId({
			userId: req.params.userId,
		});

		res.status(HTTP_STATUS.OK).json({
			data: orders,
			success: true,
		});
	});

	getById = asyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const order = await this._service.getById({ orderId: req.params.orderId });

		res.status(HTTP_STATUS.OK).json({
			data: order,
			success: true,
		});
	});

	updateToDelivered = asyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const order = await this._service.updateToDelivered({
			orderId: req.params.orderId,
		});

		res.status(HTTP_STATUS.OK).json({
			data: order,
			success: true,
		});
	});

	updateToPaid = asyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const order = await this._service.updateToPaid({
			orderId: req.params.orderId,
		});

		res.status(HTTP_STATUS.OK).json({
			data: order,
			success: true,
		});
	});

	constructor(service: IOrderService = new OrderService()) {
		this._service = service;
	}
}
