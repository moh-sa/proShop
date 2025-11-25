import type { Types } from "mongoose";

import type { IOrderRepository } from "../repositories/index.js";
import type {
	AllOrdersResponse,
	InsertOrder,
	MethodParams,
	MethodReturn,
	OrderPaginationParams,
	PaginatedResponse,
	Result,
	SelectOrder,
} from "../types/index.js";

import {
	EmptyCartError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { OrderRepository } from "../repositories/index.js";
import { insertOrderSchema, orderQuerySchema } from "../schemas/index.js";
import { getLoggerFromContext } from "../utils/index.js";
import { objectIdValidator } from "../validators/object-id.validator.js";
import { paginationParamsValidator } from "../validators/pagination.validator.js";

export interface IOrderService {
	create(data: InsertOrder): Promise<OrderResult<SelectOrder>>;
	getAll(
		args: OrderPaginationParams,
	): Promise<OrderResult<PaginatedResponse<AllOrdersResponse>>>;
	getById(data: { orderId: string }): Promise<OrderResult<SelectOrder>>;
	updateToDelivered(data: {
		orderId: string;
	}): Promise<OrderResult<SelectOrder>>;
	updateToPaid(data: { orderId: string }): Promise<OrderResult<SelectOrder>>;
}

type OrderResult<T> = Result<T>;
export class OrderService implements IOrderService {
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

		if (
			validationResult.data.orderItems &&
			validationResult.data.orderItems.length === 0
		) {
			logger.warn({ userId: data.user }, "Empty cart");
			return {
				error: new EmptyCartError(),
				success: false,
			};
		}

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
			isDelivered: args.isDelivered,
			isPaid: args.isPaid,
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
						isDelivered: 1,
						isPaid: 1,
						paidAt: 1,
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

	async updateToDelivered({
		orderId,
	}: MethodParams<IOrderService, "updateToDelivered">): MethodReturn<
		IOrderService,
		"updateToDelivered"
	> {
		const logger = this._getLogger({ method: "updateToDelivered" });
		logger.debug({ orderId }, "Updating order to delivered");

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

		const result = await this._repository.updateToDelivered({
			orderId: validationResult.data,
		});
		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to update order to delivered",
			);
			return result;
		}

		if (!result.data) {
			logger.warn({ orderId }, "Order not found");
			return {
				error: new NotFoundError("Order"),
				success: false,
			};
		}

		logger.info(
			{ deliveredAt: result.data.deliveredAt, orderId },
			"Order marked as delivered successfully",
		);
		return {
			data: result.data,
			success: true,
		};
	}

	async updateToPaid({
		orderId,
	}: MethodParams<IOrderService, "updateToPaid">): MethodReturn<
		IOrderService,
		"updateToPaid"
	> {
		const logger = this._getLogger({ method: "updateToPaid" });
		logger.debug({ orderId }, "Updating order to paid");

		const validationResult = this._validateObjectId("orderId", orderId);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error, orderId },
				"Invalid order ID",
			);
			return validationResult;
		}

		const result = await this._repository.updateToPaid({
			orderId: validationResult.data,
		});
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to update order to paid");
			return result;
		}

		if (!result.data) {
			logger.warn({ orderId }, "Order not found");
			return {
				error: new NotFoundError("Order"),
				success: false,
			};
		}

		logger.info(
			{ orderId, paidAt: result.data.paidAt },
			"Order marked as paid successfully",
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
}
