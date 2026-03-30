import type { Types } from "mongoose";

import type {
	AllOrdersResponse,
	GetAllOrdersServiceParams,
	InsertOrder,
	MarkAsCancelledParams,
	MarkAsProcessingParams,
	MethodParams,
	MethodReturn,
	OrderSelect,
	PaginatedResponse,
	Result,
	SelectOrder,
} from "../types/index.js";

import { NotFoundError, ValidationError } from "../errors/index.js";
import {
	type IOrderRepository,
	orderRepository,
} from "../repositories/index.js";
import {
	insertOrderSchema,
	markAsCancelledParamsSchema,
	markAsProcessingParamsSchema,
	orderPaginationParamsSchema,
	paymentSchema,
} from "../schemas/index.js";
import { getLoggerFromContext } from "../utils/index.js";
import { objectIdValidator } from "../validators/object-id.validator.js";

export interface IOrderService {
	create(data: InsertOrder): Promise<OrderResult<SelectOrder>>;
	getAll(
		args: GetAllOrdersServiceParams,
	): Promise<OrderResult<PaginatedResponse<AllOrdersResponse>>>;
	getById(data: { orderId: string }): Promise<OrderResult<SelectOrder>>;
	markAsCancelled(
		params: MarkAsCancelledParams,
	): Promise<OrderResult<SelectOrder>>;
	markAsProcessing(
		params: MarkAsProcessingParams,
	): Promise<OrderResult<SelectOrder>>;
	updatePayment(
		params: Partial<SelectOrder["payment"]> & { orderId: string },
	): Promise<OrderResult<SelectOrder>>;
}

type OrderResult<T> = Result<T>;
export class OrderService implements IOrderService {
	private readonly _repository: IOrderRepository;

	constructor(repository?: IOrderRepository) {
		this._repository = repository ?? orderRepository;
	}

	public async create(
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

	public async getAll(
		args: MethodParams<IOrderService, "getAll">,
	): MethodReturn<IOrderService, "getAll"> {
		const logger = this._getLogger({ method: "getAll" });
		logger.debug({ args }, "Getting all orders");

		// validate arguments
		const argsValidationResult = orderPaginationParamsSchema.safeParse(args);
		if (!argsValidationResult.success) {
			logger.warn(argsValidationResult.error, "Invalid arguments data");
			return {
				error: new ValidationError("Invalid arguments data", {
					cause: argsValidationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedArgs: argsValidationResult.data },
			"Validated arguments data",
		);

		// repository options
		const select: OrderSelect = {
			_id: true,
			createdAt: true,
			deliveredAt: true,
			"payment.paidAt": true,
			status: true,
			totalPrice: true,
			"user._id": true,
			"user.email": true,
			"user.name": true,
		};

		const result = await this._repository.getAll({
			filters: argsValidationResult.data.filters,
			pageNumber: argsValidationResult.data.pageNumber,
			pageSize: argsValidationResult.data.pageSize,
			select,
			sort: argsValidationResult.data.sort,
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

	public async getById({
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

	public async markAsCancelled(
		params: MethodParams<IOrderService, "markAsCancelled">,
	): MethodReturn<IOrderService, "markAsCancelled"> {
		const logger = this._getLogger({ method: "markAsCancelled" });
		logger.debug({ params }, "Marking order as cancelled");

		// validate params
		const validationResult = markAsCancelledParamsSchema.safeParse(params);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error, params },
				"Invalid parameters",
			);
			return {
				error: new ValidationError("Invalid parameters", {
					cause: validationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedParams: validationResult.data },
			"Validated parameters",
		);

		// call repository
		const result = await this._repository.markAsCancelled(
			validationResult.data,
		);
		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to mark order as cancelled",
			);
			return result;
		}

		if (!result.data) {
			logger.warn(
				{ orderId: validationResult.data.orderId },
				"Order not found",
			);
			return {
				error: new NotFoundError("Order"),
				success: false,
			};
		}

		logger.info(
			{ orderId: validationResult.data.orderId },
			"Order marked as cancelled successfully",
		);

		return {
			data: result.data,
			success: true,
		};
	}

	public async markAsProcessing(
		params: MethodParams<IOrderService, "markAsProcessing">,
	): MethodReturn<IOrderService, "markAsProcessing"> {
		const logger = this._getLogger({ method: "markAsProcessing" });
		logger.debug({ params }, "Marking order as processing");

		// validate params
		const validationResult = markAsProcessingParamsSchema.safeParse(params);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error, params },
				"Invalid parameters",
			);
			return {
				error: new ValidationError("Invalid parameters", {
					cause: validationResult.error,
				}),
				success: false,
			};
		}
		logger.debug(
			{ validatedParams: validationResult.data },
			"Validated parameters",
		);

		// call repository
		const result = await this._repository.markAsProcessing(
			validationResult.data,
		);
		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to mark order as processing",
			);
			return result;
		}

		if (!result.data) {
			logger.warn(
				{ orderId: validationResult.data.orderId },
				"Order not found",
			);
			return {
				error: new NotFoundError("Order"),
				success: false,
			};
		}

		logger.info(
			{ orderId: validationResult.data.orderId },
			"Order marked as processing successfully",
		);

		return {
			data: result.data,
			success: true,
		};
	}

	public async updatePayment(
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

export const orderService = new OrderService();
