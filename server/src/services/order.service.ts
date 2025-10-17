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
		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			return validationResult;
		}

		if (
			validationResult.data.orderItems &&
			validationResult.data.orderItems.length === 0
		) {
			return {
				error: new EmptyCartError(),
				success: false,
			};
		}

		const result = await this._repository.create(validationResult.data);
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async getAll(
		args: MethodParams<IOrderService, "getAll">,
	): MethodReturn<IOrderService, "getAll"> {
		const paginationResult = paginationParamsValidator
			.omit({ query: true })
			.safeParse(args);
		if (!paginationResult.success) {
			return {
				error: new ValidationError("Invalid pagination data", {
					cause: paginationResult.error,
				}),
				success: false,
			};
		}

		const queryResult = orderQuerySchema.safeParse({
			isDelivered: args.isDelivered,
			isPaid: args.isPaid,
			user: args.user,
		});
		if (!queryResult.success) {
			return {
				error: new ValidationError("Invalid query data", {
					cause: queryResult.error,
				}),
				success: false,
			};
		}

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
			return result;
		}

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
		const validationResult = this._validateObjectId("orderId", orderId);
		if (!validationResult.success) {
			return validationResult;
		}

		const result = await this._repository.getById({
			orderId: validationResult.data,
		});
		if (!result.success) {
			return result;
		}

		if (!result.data) {
			return {
				error: new NotFoundError("Order"),
				success: false,
			};
		}

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
		const validationResult = this._validateObjectId("orderId", orderId);
		if (!validationResult.success) {
			return validationResult;
		}

		const result = await this._repository.updateToDelivered({
			orderId: validationResult.data,
		});
		if (!result.success) {
			return result;
		}

		if (!result.data) {
			return {
				error: new NotFoundError("Order"),
				success: false,
			};
		}

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
		const validationResult = this._validateObjectId("orderId", orderId);
		if (!validationResult.success) {
			return validationResult;
		}

		const result = await this._repository.updateToPaid({
			orderId: validationResult.data,
		});
		if (!result.success) {
			return result;
		}

		if (!result.data) {
			return {
				error: new NotFoundError("Order"),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
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
