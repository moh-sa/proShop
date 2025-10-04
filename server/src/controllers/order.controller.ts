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

		const result = await this._service.create(data);
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.CREATED).json({
			data: result.data,
			success: true,
		});
	});

	getAll = asyncHandler<{
		resBody: { data: AllOrdersResponse };
	}>(async (req, res) => {
		const result = await this._service.getAll();
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	getAllByUserId = asyncHandler<{
		params: { userId: string };
		resBody: { data: AllOrdersResponse };
	}>(async (req, res) => {
		const result = await this._service.getAllByUserId({
			userId: req.params.userId,
		});
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	getById = asyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const result = await this._service.getById({ orderId: req.params.orderId });
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	updateToDelivered = asyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const result = await this._service.updateToDelivered({
			orderId: req.params.orderId,
		});
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	updateToPaid = asyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const result = await this._service.updateToPaid({
			orderId: req.params.orderId,
		});
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	constructor(service: IOrderService = new OrderService()) {
		this._service = service;
	}
}
