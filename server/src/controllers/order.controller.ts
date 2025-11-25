import type { IOrderService } from "../services/index.js";
import type {
	AllOrdersResponse,
	AsyncHandler,
	InsertOrder,
	OrderPaginationParams,
	PaginatedResponse,
	SafeSelectUser,
	SelectOrder,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { OrderService } from "../services/index.js";
import { asyncHandler, getLoggerFromContext } from "../utils/index.js";

export interface IOrderController {
	create: AsyncHandler<{
		locals: { user: SafeSelectUser };
		reqBody: InsertOrder;
		resBody: { data: SelectOrder };
	}>;
	getAll: AsyncHandler<{
		query: Omit<OrderPaginationParams, "user">;
		resBody: {
			data: PaginatedResponse<AllOrdersResponse>["items"];
			meta: PaginatedResponse<AllOrdersResponse>["meta"];
		};
	}>;
	getAllByUserId: AsyncHandler<{
		params: { userId: string };
		query: Omit<OrderPaginationParams, "user">;
		resBody: {
			data: PaginatedResponse<AllOrdersResponse>["items"];
			meta: PaginatedResponse<AllOrdersResponse>["meta"];
		};
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
		locals: { user: SafeSelectUser };
		reqBody: InsertOrder;
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "create" });
		logger.debug(
			{ data: req.body, userId: res.locals.user._id },
			"Creating order",
		);

		const data = {
			...req.body,
			user: res.locals.user._id,
		};
		logger.debug({ data }, "Validated order data");

		const result = await this._service.create(data);
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ orderId: result.data._id, userId: res.locals.user._id },
			"Order created successfully",
		);

		res.status(HTTP_STATUS.CREATED).json({
			data: result.data,
			success: true,
		});
	});

	getAll = asyncHandler<{
		query: Omit<OrderPaginationParams, "user">;
		resBody: {
			data: PaginatedResponse<AllOrdersResponse>["items"];
			meta: PaginatedResponse<AllOrdersResponse>["meta"];
		};
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getAll" });
		logger.debug({ query: req.query }, "Getting all orders");

		const result = await this._service.getAll(req.query);
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ totalOrders: result.data.meta.totalItems },
			"Orders retrieved successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data.items,
			meta: result.data.meta,
			success: true,
		});
	});

	getAllByUserId = asyncHandler<{
		params: { userId: string };
		query: Omit<OrderPaginationParams, "user">;
		resBody: {
			data: PaginatedResponse<AllOrdersResponse>["items"];
			meta: PaginatedResponse<AllOrdersResponse>["meta"];
		};
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getAllByUserId" });
		logger.debug(
			{ query: req.query, userId: req.params.userId },
			"Getting all orders by user ID",
		);

		const result = await this._service.getAll({
			...req.query,
			user: req.params.userId,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ totalOrders: result.data.meta.totalItems, userId: req.params.userId },
			"Orders retrieved by user ID successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data.items,
			meta: result.data.meta,
			success: true,
		});
	});

	getById = asyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getById" });
		logger.debug({ orderId: req.params.orderId }, "Getting order by ID");

		const result = await this._service.getById({ orderId: req.params.orderId });
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ orderId: result.data._id },
			"Order retrieved by ID successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	updateToDelivered = asyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "updateToDelivered" });
		logger.debug(
			{ orderId: req.params.orderId },
			"Updating order to delivered",
		);

		const result = await this._service.updateToDelivered({
			orderId: req.params.orderId,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info({ orderId: result.data._id }, "Order marked as delivered");

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	updateToPaid = asyncHandler<{
		params: { orderId: string };
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "updateToPaid" });
		logger.debug({ orderId: req.params.orderId }, "Updating order to paid");

		const result = await this._service.updateToPaid({
			orderId: req.params.orderId,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ orderId: result.data._id },
			"Order marked as paid successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	constructor(service: IOrderService = new OrderService()) {
		this._service = service;
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "order controller", ...args });
	}
}
