import type { Types } from "mongoose";
import type { Logger } from "pino";

import type { IOrderRepository } from "../repositories/index.js";
import type {
	AllOrdersResponse,
	InsertOrder,
	MethodParams,
	MethodReturn,
	OrderPaginationParams,
	OrderStatus,
	PaginatedResponse,
	Result,
	SelectOrder,
} from "../types/index.js";

import { NotFoundError, ValidationError } from "../errors/index.js";
import { OrderRepository } from "../repositories/index.js";
import {
	insertOrderSchema,
	orderQuerySchema,
	orderStatusSchema,
	paymentSchema,
} from "../schemas/index.js";
import { getLoggerFromContext } from "../utils/index.js";
import { objectIdValidator } from "../validators/object-id.validator.js";
import { paginationParamsValidator } from "../validators/pagination.validator.js";

export interface IOrderService {
	create(data: InsertOrder): Promise<OrderResult<SelectOrder>>;
	getAll(
		args: OrderPaginationParams,
	): Promise<OrderResult<PaginatedResponse<AllOrdersResponse>>>;
	getById(data: { orderId: string }): Promise<OrderResult<SelectOrder>>;
	updatePayment(
		params: Partial<SelectOrder["payment"]> & { orderId: string },
	): Promise<OrderResult<SelectOrder>>;
	updateStatus(data: {
		orderId: string;
		status: OrderStatus;
	}): Promise<OrderResult<SelectOrder>>;
}

type OrderResult<T> = Result<T>;
export class OrderService implements IOrderService {
	private readonly _allowedTransitions: Record<
		OrderStatus,
		ReadonlyArray<OrderStatus>
	> = {
		cancelled: [],
		delivered: [],
		pending: ["processing", "cancelled"],
		processing: ["delivered"],
	};
	private readonly _repository: IOrderRepository;

	constructor(repository: IOrderRepository = new OrderRepository()) {
		this._repository = repository;
	}

	async create(
		data: MethodParams<IOrderService, "create">,
	): MethodReturn<IOrderService, "create"> {
		const logger = this._getLogger({ method: "create" });
		logger.debug({ data }, "Creating order");

		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			logger.warn({ error: validationResult.error }, "Invalid order data");
			return validationResult;
		}

		logger.debug(
			{ validatedData: validationResult.data },
			"Validated order data",
		);

		const result = await this._repository.create(validationResult.data);
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to create order");
			return result;
		}

		logger.info(
			{
				orderId: result.data._id,
				totalPrice: result.data.totalPrice,
				userId: result.data.user._id,
			},
			"Order created successfully",
		);
		return {
			data: result.data,
			success: true,
		};
	}

	async getAll(
		args: MethodParams<IOrderService, "getAll">,
	): MethodReturn<IOrderService, "getAll"> {
		const logger = this._getLogger({ method: "getAll" });
		logger.debug({ args }, "Getting all orders");

		const paginationResult = paginationParamsValidator
			.omit({ query: true })
			.safeParse(args);
		if (!paginationResult.success) {
			logger.warn({ error: paginationResult.error }, "Invalid pagination data");
			return {
				error: new ValidationError("Invalid pagination data", {
					cause: paginationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ paginationResult: paginationResult.data },
			"Validated pagination data",
		);

		const queryResult = orderQuerySchema.safeParse({
			status: args.status,
			user: args.user,
		});
		if (!queryResult.success) {
			logger.warn({ error: queryResult.error }, "Invalid query data");
			return {
				error: new ValidationError("Invalid query data", {
					cause: queryResult.error,
				}),
				success: false,
			};
		}

		logger.debug({ queryResult: queryResult.data }, "Validated query data");

		const result = await this._repository.getAll({
			pageNumber: paginationResult.data.pageNumber,
			pageSize: paginationResult.data.pageSize,
			pipeline: [
				{
					$project: {
						_id: 1,
						createdAt: 1,
						deliveredAt: 1,
						paidAt: 1,
						status: 1,
						totalPrice: 1,
						user: 1,
					},
				},
			],
			query: queryResult.data,
			sort: paginationResult.data.sort,
		});
		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to retrieve paginated orders",
			);
			return result;
		}

		logger.info(
			{ totalOrders: result.data.meta.totalItems },
			"Orders retrieved successfully",
		);

		return {
			data: result.data,
			success: true,
		};
	}

	async getById({
		orderId,
	}: MethodParams<IOrderService, "getById">): MethodReturn<
		IOrderService,
		"getById"
	> {
		const logger = this._getLogger({ method: "getById" });
		logger.debug({ orderId }, "Getting order by ID");

		const validationResult = this._validateObjectId("orderId", orderId);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error, orderId },
				"Invalid order ID",
			);
			return validationResult;
		}

		logger.debug(
			{ validatedOrderId: validationResult.data },
			"Validated order ID",
		);

		const result = await this._repository.getById({
			orderId: validationResult.data,
		});
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to retrieve order");
			return result;
		}

		if (!result.data) {
			logger.warn({ orderId }, "Order not found");
			return {
				error: new NotFoundError("Order"),
				success: false,
			};
		}

		logger.info({ orderId }, "Order retrieved successfully");
		return {
			data: result.data,
			success: true,
		};
	}

	async updatePayment(
		params: Partial<SelectOrder["payment"]> & { orderId: string },
	): Promise<OrderResult<SelectOrder>> {
		const logger = this._getLogger({ method: "updatePayment" });
		logger.debug({ params }, "Updating payment");

		// validate orderId
		const idResult = this._validateObjectId("orderId", params.orderId);
		if (!idResult.success) {
			logger.warn(
				{ error: idResult.error, orderId: params.orderId },
				"Invalid order ID",
			);
			return idResult;
		}

		logger.debug({ validatedOrderId: idResult.data }, "Validated order ID");

		// validate payment data
		const paymentResult = paymentSchema.partial().safeParse(params);
		if (!paymentResult.success) {
			logger.warn(
				{ error: paymentResult.error, payment: params },
				"Invalid payment data",
			);
			return {
				error: new ValidationError("Invalid payment data", {
					cause: paymentResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedPayment: paymentResult.data },
			"Validated payment data",
		);

		// update payment
		const result = await this._repository.updatePayment({
			orderId: idResult.data,
			...paymentResult.data,
		});
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to update payment");
			return result;
		}

		if (!result.data) {
			logger.warn({ orderId: params.orderId }, "Order not found");
			return {
				error: new NotFoundError("Order"),
				success: false,
			};
		}

		logger.info({ orderId: params.orderId }, "Payment updated successfully");
		return {
			data: result.data,
			success: true,
		};
	}

	async updateStatus({
		orderId,
		status,
	}: MethodParams<IOrderService, "updateStatus">): MethodReturn<
		IOrderService,
		"updateStatus"
	> {
		const logger = this._getLogger({ method: "updateStatus" });
		logger.debug({ orderId, status }, "Updating order status");

		// Validate orderId
		const idResult = this._validateObjectId("orderId", orderId);
		if (!idResult.success) {
			logger.warn({ error: idResult.error, orderId }, "Invalid order ID");
			return idResult;
		}

		// Validate status
		const statusResult = orderStatusSchema.safeParse(status);
		if (!statusResult.success) {
			logger.warn(
				{ error: statusResult.error, status },
				"Invalid status value",
			);
			return {
				error: new ValidationError("Invalid status value", {
					cause: statusResult.error,
				}),
				success: false,
			};
		}

		const newStatus = statusResult.data;

		// Get the current order
		const currentOrderResult = await this._repository.getById({
			orderId: idResult.data,
		});
		if (!currentOrderResult.success) {
			logger.error(
				{ error: currentOrderResult.error },
				"Failed to retrieve order for status update",
			);
			return currentOrderResult;
		}

		if (!currentOrderResult.data) {
			logger.warn({ orderId }, "Order not found");
			return {
				error: new NotFoundError("Order"),
				success: false,
			};
		}

		// Validate the status transition
		const currentStatus = currentOrderResult.data.status;

		const statusTransitionResult = this._validateStatusTransition({
			currentStatus,
			logger,
			newStatus,
			orderId: idResult.data.toString(),
		});
		if (!statusTransitionResult.success) {
			return statusTransitionResult;
		}

		// update the status
		const result = await this._repository.updateStatus({
			orderId: idResult.data,
			status: newStatus,
		});
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to update order status");
			return result;
		}

		if (!result.data) {
			logger.warn({ orderId }, "Order not found after update");
			return {
				error: new NotFoundError("Order"),
				success: false,
			};
		}

		logger.info(
			{ orderId, previousStatus: currentStatus, status: newStatus },
			"Order status updated successfully",
		);

		return {
			data: result.data,
			success: true,
		};
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "order service", ...args });
	}

	private _validateCreateData(data: InsertOrder): OrderResult<InsertOrder> {
		const result = insertOrderSchema.safeParse(data);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid order data", {
					cause: result.error,
				}),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	private _validateObjectId(
		field: string,
		id: string,
	): OrderResult<Types.ObjectId> {
		const result = objectIdValidator.safeParse(id);
		if (!result.success) {
			return {
				error: new ValidationError(`Invalid ${field}`, { cause: result.error }),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	private _validateStatusTransition(params: {
		currentStatus: OrderStatus;
		logger: Logger;
		newStatus: OrderStatus;
		orderId: string;
	}): OrderResult<void> {
		const allowedStatus = this._allowedTransitions[params.currentStatus];

		if (!allowedStatus.includes(params.newStatus)) {
			params.logger.warn(
				{
					currentStatus: params.currentStatus,
					orderId: params.orderId,
					requestedStatus: params.newStatus,
				},
				"Invalid status transition",
			);
			return {
				error: new ValidationError(
					`Cannot transition order from '${params.currentStatus}' to '${params.newStatus}'`,
				),
				success: false,
			};
		}

		return {
			data: undefined,
			success: true,
		};
	}
}
