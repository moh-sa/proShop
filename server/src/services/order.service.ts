import type { Types } from "mongoose";

import type { IOrderRepository } from "../repositories/index.js";
import type {
	AllOrdersResponse,
	InsertOrder,
	MethodParams,
	MethodReturn,
	Result,
	SelectOrder,
} from "../types/index.js";

import {
	EmptyCartError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { OrderRepository } from "../repositories/index.js";
import { insertOrderSchema } from "../schemas/index.js";
import { objectIdValidator } from "../validators/object-id.validator.js";

export interface IOrderService {
	create(data: InsertOrder): Promise<SelectOrder>;
	getAll(): Promise<AllOrdersResponse>;
	getAllByUserId(data: { userId: string }): Promise<AllOrdersResponse>;
	getById(data: { orderId: string }): Promise<SelectOrder>;
	updateToDelivered(data: { orderId: string }): Promise<SelectOrder>;
	updateToPaid(data: { orderId: string }): Promise<SelectOrder>;
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
			throw validationResult.error;
		}

		if (
			validationResult.data.orderItems &&
			validationResult.data.orderItems.length === 0
		) {
			throw new EmptyCartError();
		}

		const result = await this._repository.create(validationResult.data);
		if (!result.success) {
			throw result.error;
		}

		return result.data;
	}

	async getAll(): MethodReturn<IOrderService, "getAll"> {
		const result = await this._repository.getAll();
		if (!result.success) {
			throw result.error;
		}

		return result.data;
	}

	async getAllByUserId({
		userId,
	}: MethodParams<IOrderService, "getAllByUserId">): MethodReturn<
		IOrderService,
		"getAllByUserId"
	> {
		const validationResult = this._validateObjectId("userId", userId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const result = await this._repository.getAllByUserId({
			userId: validationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		return result.data;
	}

	async getById({
		orderId,
	}: MethodParams<IOrderService, "getById">): MethodReturn<
		IOrderService,
		"getById"
	> {
		const validationResult = this._validateObjectId("orderId", orderId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const result = await this._repository.getById({
			orderId: validationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		if (!result.data) {
			throw new NotFoundError("Order");
		}

		return result.data;
	}

	async updateToDelivered({
		orderId,
	}: MethodParams<IOrderService, "updateToDelivered">): MethodReturn<
		IOrderService,
		"updateToDelivered"
	> {
		const validationResult = this._validateObjectId("orderId", orderId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const result = await this._repository.updateToDelivered({
			orderId: validationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		if (!result.data) {
			throw new NotFoundError("Order");
		}

		return result.data;
	}

	async updateToPaid({
		orderId,
	}: MethodParams<IOrderService, "updateToPaid">): MethodReturn<
		IOrderService,
		"updateToPaid"
	> {
		const validationResult = this._validateObjectId("orderId", orderId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const result = await this._repository.updateToPaid({
			orderId: validationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		if (!result.data) {
			throw new NotFoundError("Order");
		}

		return result.data;
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
