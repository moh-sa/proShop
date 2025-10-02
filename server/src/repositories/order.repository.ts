import type { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	AllOrdersResponse,
	FailureResult,
	InsertOrder,
	MethodParams,
	MethodReturn,
	Result,
	SelectOrder,
} from "../types/index.js";

import Order from "../models/order.model.js";
import { handleDatabaseErrorResult } from "../utils/index.js";

export interface IOrderRepository {
	create(data: InsertOrder): Promise<OrderResult<SelectOrder>>;
	getAll(): Promise<OrderResult<AllOrdersResponse>>;
	getAllByUserId(data: {
		userId: Types.ObjectId;
	}): Promise<OrderResult<AllOrdersResponse>>;
	getById({
		orderId,
	}: {
		orderId: Types.ObjectId;
	}): Promise<OrderResult<null | SelectOrder>>;
	updateToDelivered({
		orderId,
	}: {
		orderId: Types.ObjectId;
	}): Promise<OrderResult<null | SelectOrder>>;
	updateToPaid({
		orderId,
	}: {
		orderId: Types.ObjectId;
	}): Promise<OrderResult<null | SelectOrder>>;
}

type OrderResult<T> = Result<T, DatabaseBaseError>;

export class OrderRepository implements IOrderRepository {
	private readonly _db: typeof Order;

	constructor(db: typeof Order = Order) {
		this._db = db;
	}

	async create(
		data: MethodParams<IOrderRepository, "create">,
	): MethodReturn<IOrderRepository, "create"> {
		try {
			const result = await this._db.create(data);
			return {
				data: result.toObject(),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getAll(): MethodReturn<IOrderRepository, "getAll"> {
		try {
			const result = await this._db
				.find({})
				.select(
					"_id createdAt isPaid paidAt isDelivered deliveredAt totalPrice user",
				)
				.lean();
			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getAllByUserId({
		userId,
	}: MethodParams<IOrderRepository, "getAllByUserId">): MethodReturn<
		IOrderRepository,
		"getAllByUserId"
	> {
		try {
			const result = await this._db
				.find({ user: userId })
				.select(
					"_id createdAt isPaid paidAt isDelivered deliveredAt totalPrice user",
				)
				.lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getById({
		orderId,
	}: MethodParams<IOrderRepository, "getById">): MethodReturn<
		IOrderRepository,
		"getById"
	> {
		try {
			const result = await this._db
				.findById(orderId)
				.populate("user", "name email")
				.lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async updateToDelivered({
		orderId,
	}: MethodParams<IOrderRepository, "getById">): MethodReturn<
		IOrderRepository,
		"getById"
	> {
		try {
			const result = await this._db
				.findByIdAndUpdate(
					orderId,
					{
						$set: {
							deliveredAt: new Date(),
							isDelivered: true,
						},
					},
					{ new: true },
				)
				.lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async updateToPaid({
		orderId,
	}: MethodParams<IOrderRepository, "updateToDelivered">): MethodReturn<
		IOrderRepository,
		"updateToDelivered"
	> {
		try {
			const result = await this._db
				.findByIdAndUpdate(
					orderId,
					{
						$set: {
							isPaid: true,
							paidAt: new Date(),
						},
					},
					{
						new: true,
					},
				)
				.lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): FailureResult<DatabaseBaseError> {
		return handleDatabaseErrorResult(error);
	}
}
