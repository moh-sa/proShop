import { ERROR_TYPE } from "../constants/error-type.constants.js";
import { HTTP_STATUS } from "../constants/http-status.constants.js";
import { ForbiddenError, ValidationError } from "../errors/index.js";
import type { IOrderManager } from "../managers/index.js";
import { orderManager } from "../managers/index.js";
import type {
	AllOrdersResponse,
	AsyncHandler,
	CreateOrder,
	CreateOrderResponse,
	GetAllOrdersByUserIdControllerParams,
	GetAllOrdersControllerParams,
	GetAllOrdersManagerParams,
	Order,
	PaginatedResponse,
	SafeSelectUser,
} from "../types/index.js";
import {
	asyncHandler,
	fromCurrencySmallestUnit,
	getLoggerFromContext,
	sendErrorResponse,
	toCurrencySmallestUnit,
} from "../utils/index.js";

export interface IOrderController {
	adminCancelOrder: AsyncHandler<{
		params: { orderId: string };
		resBody: { data: Order };
	}>;
	cancelOrder: AsyncHandler<{
		locals: { user: SafeSelectUser };
		params: { orderId: string };
		resBody: { data: Order };
	}>;
	create: AsyncHandler<{
		locals: { user: SafeSelectUser };
		reqBody: CreateOrder;
		resBody: { data: CreateOrderResponse };
	}>;
	getAll: AsyncHandler<{
		query: GetAllOrdersControllerParams;
		resBody: {
			data: PaginatedResponse<AllOrdersResponse>["items"];
			meta: PaginatedResponse<AllOrdersResponse>["meta"];
		};
	}>;
	getAllByUserId: AsyncHandler<{
		params: { userId: string };
		query: GetAllOrdersByUserIdControllerParams;
		resBody: {
			data: PaginatedResponse<AllOrdersResponse>["items"];
			meta: PaginatedResponse<AllOrdersResponse>["meta"];
		};
	}>;
	getById: AsyncHandler<{
		params: { orderId: string };
		resBody: { data: Order };
	}>;
	handleStripeWebhook: AsyncHandler<{
		resBody: { data: { success: boolean } };
	}>;
	markAsDelivered: AsyncHandler<{
		params: { orderId: string };
		resBody: { data: Order };
	}>;
	updatePayment: AsyncHandler<{
		params: { orderId: string };
		reqBody: Partial<Order["payment"]>;
		resBody: { data: Order };
	}>;
}
export class OrderController implements IOrderController {
	private readonly _manager: IOrderManager;

	create = asyncHandler<{
		locals: { user: SafeSelectUser };
		reqBody: CreateOrder;
		resBody: { data: CreateOrderResponse };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "create" });
		logger.debug(
			{ data: req.body, userId: res.locals.user.id },
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
				orderId: result.data.order.id,
				sessionUrl: result.data.session.url,
				userId: res.locals.user.id,
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
		query: GetAllOrdersControllerParams;
		resBody: {
			data: PaginatedResponse<AllOrdersResponse>["items"];
			meta: PaginatedResponse<AllOrdersResponse>["meta"];
		};
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getAll" });
		logger.debug({ query: req.query }, "Getting all orders");

		const options: GetAllOrdersManagerParams = {
			filters: {
				status: req.query.status,
			},
			pageNumber: req.query.pageNumber,
			pageSize: req.query.pageSize,
			sort: req.query.sort,
		};
		const result = await this._manager.getAll(options);
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
		query: GetAllOrdersByUserIdControllerParams;
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

		const options: GetAllOrdersManagerParams = {
			filters: {
				status: req.query.status,
				userId: req.params.userId,
			},
			pageNumber: req.query.pageNumber,
			pageSize: req.query.pageSize,
			sort: req.query.sort,
		};
		const result = await this._manager.getAll(options);
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
		resBody: { data: Order };
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
			userId: result.data.user.id,
		});

		logger.info(
			{ orderId: result.data.id },
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
				code: ERROR_TYPE.BAD_REQUEST,
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
				code: ERROR_TYPE.BAD_REQUEST,
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
		reqBody: Partial<Order["payment"]>;
		resBody: { data: Order };
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
			{ orderId: result.data.id, payment: result.data.payment },
			"Payment updated successfully",
		);

		const dataToSend = this._convertOrderToDollars(result.data);

		res.status(HTTP_STATUS.OK).json({
			data: dataToSend,
			success: true,
		});
	});

	adminCancelOrder = asyncHandler<{
		params: { orderId: string };
		resBody: { data: Order };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "adminCancelOrder" });
		logger.debug({ orderId: req.params.orderId }, "Admin cancelling order");

		const order = await this._cancelPendingOrder({
			logger,
			orderId: req.params.orderId,
		});

		logger.info({ orderId: order.id }, "Order cancelled by admin successfully");

		const dataToSend = this._convertOrderToDollars(order);
		res.status(HTTP_STATUS.OK).json({ data: dataToSend, success: true });
	});

	cancelOrder = asyncHandler<{
		locals: { user: SafeSelectUser };
		params: { orderId: string };
		resBody: { data: Order };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "cancelOrder" });
		logger.debug(
			{ orderId: req.params.orderId, userId: res.locals.user.id },
			"User cancelling order",
		);

		// Verify the requesting user owns this order
		const getResult = await this._manager.getById({
			orderId: req.params.orderId,
		});
		if (!getResult.success) {
			throw getResult.error;
		}

		this._authorizeResourceAccess({
			localUser: res.locals.user,
			logger,
			userId: getResult.data.user.id,
		});

		const order = await this._cancelPendingOrder({
			logger,
			orderId: req.params.orderId,
		});

		logger.info({ orderId: order.id }, "Order cancelled by user successfully");

		const dataToSend = this._convertOrderToDollars(order);
		res.status(HTTP_STATUS.OK).json({ data: dataToSend, success: true });
	});

	markAsDelivered = asyncHandler<{
		params: { orderId: string };
		resBody: { data: Order };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "markAsDelivered" });
		logger.debug({ orderId: req.params.orderId }, "Marking order as delivered");

		const result = await this._manager.markAsDelivered({
			orderId: req.params.orderId,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ orderId: result.data.id },
			"Order marked as delivered successfully",
		);

		const dataToSend = this._convertOrderToDollars(result.data);
		res.status(HTTP_STATUS.OK).json({ data: dataToSend, success: true });
	});

	constructor(manager?: IOrderManager) {
		this._manager = manager ?? orderManager;
	}

	private async _cancelPendingOrder(params: {
		logger: ReturnType<typeof getLoggerFromContext>;
		orderId: string;
	}): Promise<Order> {
		const getResult = await this._manager.getById({
			orderId: params.orderId,
		});
		if (!getResult.success) {
			throw getResult.error;
		}

		if (getResult.data.status !== "pending") {
			params.logger.warn(
				{ orderId: params.orderId, status: getResult.data.status },
				"Cannot cancel a non-pending order",
			);
			throw new ValidationError(
				"Only pending orders can be cancelled. Paid orders are not eligible for cancellation.",
			);
		}

		const cancelResult = await this._manager.markAsCancelled({
			orderId: params.orderId,
		});
		if (!cancelResult.success) {
			throw cancelResult.error;
		}

		return cancelResult.data;
	}

	private _authorizeResourceAccess(params: {
		localUser: SafeSelectUser | undefined;
		logger: ReturnType<typeof getLoggerFromContext>;
		userId: string;
	}) {
		params.logger.debug(params, "Authorizing access to resource");

		const isSameUser = params.userId === params.localUser?.id;
		const isAdmin = params.localUser?.isAdmin;
		if (!isSameUser && !isAdmin) {
			params.logger.warn(
				{
					localUserId: params.localUser?.id,
					userId: params.userId,
				},
				"User is not authorized to access this resource",
			);
			throw new ForbiddenError(
				"You are not authorized to access this resource.",
				{
					localUserId: params.localUser?.id,
					userId: params.userId,
				},
			);
		}
	}

	private _convertOrderToCents(order: CreateOrder): CreateOrder {
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

	private _convertOrderToDollars(order: Order): Order {
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
