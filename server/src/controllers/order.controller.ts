import type { IOrderService } from "../services/index.js";
import type { AsyncRequestHandler } from "../types/index.js";

import { insertOrderSchema } from "../schemas/index.js";
import { OrderService } from "../services/index.js";
import { asyncHandler, sendSuccessResponse } from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IOrderController {
	create: AsyncRequestHandler;
	getAll: AsyncRequestHandler;
	getAllByUserId: AsyncRequestHandler<unknown, unknown, { userId: string }>;
	getById: AsyncRequestHandler<unknown, unknown, { orderId: string }>;
	updateToDelivered: AsyncRequestHandler<unknown, unknown, { orderId: string }>;
	updateToPaid: AsyncRequestHandler<unknown, unknown, { orderId: string }>;
}
export class OrderController implements IOrderController {
	private readonly _service: IOrderService;

	create = asyncHandler(async (req, res) => {
		const data = insertOrderSchema.parse({
			...req.body,
			user: res.locals.user._id,
		});

		const response = await this._service.create(data);

		return sendSuccessResponse({
			data: response,
			responseContext: res,
			statusCode: 201,
		});
	});

	getAll = asyncHandler(async (req, res) => {
		const orders = await this._service.getAll();

		return sendSuccessResponse({
			data: orders,
			responseContext: res,
			statusCode: 200,
		});
	});

	getAllByUserId = asyncHandler<unknown, unknown, { userId: string }>(
		async (req, res) => {
			const userId = objectIdValidator.parse(req.params.userId);

			const orders = await this._service.getAllByUserId({ userId });

			return sendSuccessResponse({
				data: orders,
				responseContext: res,
				statusCode: 200,
			});
		},
	);

	getById = asyncHandler<unknown, unknown, { orderId: string }>(
		async (req, res) => {
			const orderId = objectIdValidator.parse(req.params.orderId);

			const order = await this._service.getById({ orderId });

			return sendSuccessResponse({
				data: order,
				responseContext: res,
				statusCode: 200,
			});
		},
	);

	updateToDelivered = asyncHandler<unknown, unknown, { orderId: string }>(
		async (req, res) => {
			const orderId = objectIdValidator.parse(req.params.orderId);

			const order = await this._service.updateToDelivered({ orderId });

			return sendSuccessResponse({
				data: order,
				responseContext: res,
				statusCode: 200,
			});
		},
	);

	updateToPaid = asyncHandler<unknown, unknown, { orderId: string }>(
		async (req, res) => {
			const orderId = objectIdValidator.parse(req.params.orderId);

			const order = await this._service.updateToPaid({ orderId });

			return sendSuccessResponse({
				data: order,
				responseContext: res,
				statusCode: 200,
			});
		},
	);

	constructor(service: IOrderService = new OrderService()) {
		this._service = service;
	}
}
