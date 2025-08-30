import type { Types } from "mongoose";

import type {
	AllOrdersResponse,
	InsertOrder,
	SelectOrder,
} from "../types/index.js";

import Order from "../models/order.model.js";
import { handleDatabaseError } from "../utils/index.js";

export interface IOrderRepository {
	create(data: InsertOrder): Promise<SelectOrder>;
	getAll(): Promise<AllOrdersResponse>;
	getAllByUserId(data: { userId: Types.ObjectId }): Promise<AllOrdersResponse>;
	getById({
		orderId,
	}: {
		orderId: Types.ObjectId;
	}): Promise<null | SelectOrder>;
	updateToDelivered({
		orderId,
	}: {
		orderId: Types.ObjectId;
	}): Promise<null | SelectOrder>;
	updateToPaid({
		orderId,
	}: {
		orderId: Types.ObjectId;
	}): Promise<null | SelectOrder>;
}
export class OrderRepository implements IOrderRepository {
	private readonly _db: typeof Order;

	constructor(db: typeof Order = Order) {
		this._db = db;
	}

	async create(data: InsertOrder): Promise<SelectOrder> {
		try {
			return (await this._db.create(data)).toObject();
		} catch (error) {
			this._errorHandler(error);
		}
	}

	async getAll(): Promise<AllOrdersResponse> {
		try {
			return await this._db
				.find({})
				.select(
					"_id createdAt isPaid paidAt isDelivered deliveredAt totalPrice user",
				)
				.lean();
		} catch (error) {
			this._errorHandler(error);
		}
	}

	async getAllByUserId({
		userId,
	}: {
		userId: Types.ObjectId;
	}): Promise<AllOrdersResponse> {
		try {
			return await this._db
				.find({ user: userId })
				.select(
					"_id createdAt isPaid paidAt isDelivered deliveredAt totalPrice user",
				)
				.lean();
		} catch (error) {
			this._errorHandler(error);
		}
	}

	async getById({
		orderId,
	}: {
		orderId: Types.ObjectId;
	}): Promise<null | SelectOrder> {
		try {
			return await this._db
				.findById(orderId)
				.populate("user", "name email")
				.lean();
		} catch (error) {
			this._errorHandler(error);
		}
	}

	async updateToDelivered({
		orderId,
	}: {
		orderId: Types.ObjectId;
	}): Promise<null | SelectOrder> {
		try {
			return await this._db
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
		} catch (error) {
			this._errorHandler(error);
		}
	}

	async updateToPaid({
		orderId,
	}: {
		orderId: Types.ObjectId;
	}): Promise<null | SelectOrder> {
		try {
			return await this._db
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
		} catch (error) {
			this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): never {
		return handleDatabaseError(error);
	}
}
