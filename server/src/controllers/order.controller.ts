import type { IOrderManager } from "../managers/index.js";
import type {
	AllOrdersResponse,
	AsyncHandler,
	CreateOrderResponse,
	InsertOrder,
	OrderPaginationParams,
	PaginatedResponse,
	SafeSelectUser,
	SelectOrder,
} from "../types/index.js";

import { ErrorType, HTTP_STATUS } from "../constants/index.js";
import { ForbiddenError } from "../errors/index.js";
import { orderManager } from "../managers/index.js";
import {
	asyncHandler,
	fromCurrencySmallestUnit,
	getLoggerFromContext,
	sendErrorResponse,
	toCurrencySmallestUnit,
} from "../utils/index.js";

export interface IOrderController {
	create: AsyncHandler<{
		locals: { user: SafeSelectUser };
		reqBody: InsertOrder;
		resBody: { data: CreateOrderResponse };
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
	handleStripeWebhook: AsyncHandler<{
		resBody: { data: { success: boolean } };
	}>;
	updatePayment: AsyncHandler<{
		params: { orderId: string };
		reqBody: Partial<SelectOrder["payment"]>;
		resBody: { data: SelectOrder };
	}>;
}
export class OrderController implements IOrderController {
	private readonly _manager: IOrderManager;

	create = asyncHandler<{
		locals: { user: SafeSelectUser };
		reqBody: InsertOrder;
		resBody: { data: CreateOrderResponse };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "create" });
		logger.debug(
			{ data: req.body, userId: res.locals.user._id },
			"Creating order with checkout session",
		);

		const dataToCreate = this._convertOrderToCents({
			...req.body,
			user: res.locals.user,
		});
		logger.debug({ data: dataToCreate }, "Validated order data");

		const result = await this._manager.create(dataToCreate);
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{
				orderId: result.data.order._id,
				sessionUrl: result.data.session.url,
				userId: res.locals.user._id,
			},
			"Order and checkout session created successfully",
		);

		res.status(HTTP_STATUS.CREATED).json({
			data: {
				order: this._convertOrderToDollars(result.data.order),
				session: result.data.session,
			},
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

		const result = await this._manager.getAll(req.query);
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ totalOrders: result.data.meta.totalItems },
			"Orders retrieved successfully",
		);

		const dataToSend = result.data.items.map((order) => ({
			...order,
			totalPrice: this._toDollars(order.totalPrice),
		}));

		res.status(HTTP_STATUS.OK).json({
			data: dataToSend,
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

		// check if user is authorized to access this resource
		this._authorizeResourceAccess({
			localUser: res.locals.user,
			logger,
			userId: req.params.userId,
		});

		const result = await this._manager.getAll({
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

		const dataToSend = result.data.items.map((order) => ({
			...order,
			totalPrice: this._toDollars(order.totalPrice),
		}));

		res.status(HTTP_STATUS.OK).json({
			data: dataToSend,
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

		const result = await this._manager.getById({ orderId: req.params.orderId });
		if (!result.success) {
			throw result.error;
		}

		// check if user is authorized to access this resource
		this._authorizeResourceAccess({
			localUser: res.locals.user,
			logger,
			userId: result.data.user._id.toString(),
		});

		logger.info(
			{ orderId: result.data._id },
			"Order retrieved by ID successfully",
		);

		const dataToSend = this._convertOrderToDollars(result.data);

		res.status(HTTP_STATUS.OK).json({
			data: dataToSend,
			success: true,
		});
	});

	handleStripeWebhook = asyncHandler<{
		resBody: { data: { success: boolean } };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "handleStripeWebhook" });
		logger.debug("Processing stripe webhook");

		// Validate signature header exists and is a string
		const signature = req.headers["stripe-signature"];
		if (!signature || typeof signature !== "string") {
			logger.warn("Missing or invalid stripe-signature header");
			return sendErrorResponse({
				code: ErrorType.BAD_REQUEST,
				errors: [{ message: "Missing or invalid stripe-signature header" }],
				responseContext: res,
				statusCode: HTTP_STATUS.BAD_REQUEST,
			});
		}

		// Validate body is a buffer
		const payload = req.body;
		if (!Buffer.isBuffer(payload)) {
			logger.warn("Missing or invalid body");
			return sendErrorResponse({
				code: ErrorType.BAD_REQUEST,
				errors: [{ message: "Missing or invalid body" }],
				responseContext: res,
				statusCode: HTTP_STATUS.BAD_REQUEST,
			});
		}

		// Verify webhook signature and extract event data
		const verifyResult = await this._manager.processPaymentWebhook({
			payload,
			signature,
		});
		if (!verifyResult.success) {
			throw verifyResult.error;
		}

		logger.info("Payment webhook processed successfully");
		res.status(HTTP_STATUS.OK).json({ data: { success: true }, success: true });
	});

	updatePayment = asyncHandler<{
		params: { orderId: string };
		reqBody: Partial<SelectOrder["payment"]>;
		resBody: { data: SelectOrder };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "updatePayment" });
		logger.debug(
			{ orderId: req.params.orderId, payment: req.body },
			"Updating payment",
		);

		const result = await this._manager.updatePayment({
			orderId: req.params.orderId,
			...req.body,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ orderId: result.data._id, payment: result.data.payment },
			"Payment updated successfully",
		);

		const dataToSend = this._convertOrderToDollars(result.data);

		res.status(HTTP_STATUS.OK).json({
			data: dataToSend,
			success: true,
		});
	});

	constructor(manager?: IOrderManager) {
		this._manager = manager ?? orderManager;
	}

	private _authorizeResourceAccess(params: {
		localUser: SafeSelectUser | undefined;
		logger: ReturnType<typeof getLoggerFromContext>;
		userId: string;
	}) {
		params.logger.debug(params, "Authorizing access to resource");

		const isSameUser = params.userId === params.localUser?._id.toString();
		const isAdmin = params.localUser?.isAdmin;
		if (!isSameUser && !isAdmin) {
			params.logger.warn(
				{
					localUserId: params.localUser?._id.toString(),
					userId: params.userId,
				},
				"User is not authorized to access this resource",
			);
			throw new ForbiddenError(
				"You are not authorized to access this resource.",
				{
					localUserId: params.localUser?._id.toString(),
					userId: params.userId,
				},
			);
		}
	}

	private _convertOrderToCents(order: InsertOrder): InsertOrder {
		return {
			...order,
			itemsPrice: this._toCents(order.itemsPrice),
			orderItems: order.orderItems.map((item) => ({
				...item,
				price: this._toCents(item.price),
			})),
			shippingPrice: this._toCents(order.shippingPrice),
			taxPrice: this._toCents(order.taxPrice),
			totalPrice: this._toCents(order.totalPrice),
		};
	}

	private _convertOrderToDollars(order: SelectOrder): SelectOrder {
		return {
			...order,
			itemsPrice: this._toDollars(order.itemsPrice),
			orderItems: order.orderItems.map((item) => ({
				...item,
				price: this._toDollars(item.price),
			})),
			shippingPrice: this._toDollars(order.shippingPrice),
			taxPrice: this._toDollars(order.taxPrice),
			totalPrice: this._toDollars(order.totalPrice),
		};
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "order controller", ...args });
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

export const orderController = new OrderController();
