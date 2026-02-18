import type { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	AllOrdersResponse,
	FailureResult,
	InsertOrder,
	MethodParams,
	MethodReturn,
	OrderStatus,
	PaginatedResponse,
	PaginationParamsQuery,
	Result,
	SelectOrder,
} from "../types/index.js";

import Order from "../models/order.model.js";
import { handleDatabaseErrorResult, Paginator } from "../utils/index.js";

export interface IOrderRepository {
	create(data: InsertOrder): Promise<OrderResult<SelectOrder>>;
	getAll(
		args: PaginationParamsQuery<SelectOrder>,
	): Promise<OrderResult<PaginatedResponse<AllOrdersResponse>>>;
	getById({
		orderId,
	}: {
		orderId: Types.ObjectId;
	}): Promise<OrderResult<null | SelectOrder>>;
	updateStatus({
		orderId,
		status,
	}: {
		orderId: Types.ObjectId;
		status: OrderStatus;
	}): Promise<OrderResult<null | SelectOrder>>;
}

type OrderResult<T> = Result<T, DatabaseBaseError>;

export class OrderRepository implements IOrderRepository {
	private readonly _db: typeof Order;
	private _paginator: Paginator<SelectOrder>;

	constructor(db: typeof Order = Order) {
		this._db = db;
		this._paginator = new Paginator(this._db);
	}

	async create(
		data: MethodParams<IOrderRepository, "create">,
	): MethodReturn<IOrderRepository, "create"> {
		try {
			const order = await this._db.create(data);
			const populated = await order.populate("user", "_id name email");
			return {
				data: populated.toObject(),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getAll(
		args: MethodParams<IOrderRepository, "getAll">,
	): MethodReturn<IOrderRepository, "getAll"> {
		try {
			const result = await this._paginator.paginate<AllOrdersResponse>({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				pipeline: args.pipeline,
				query: args.query,
				sort: args.sort,
			});

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

	async updateStatus({
		orderId,
		status,
	}: MethodParams<IOrderRepository, "updateStatus">): MethodReturn<
		IOrderRepository,
		"updateStatus"
	> {
		const updateFields: Record<string, unknown> = { status };
		const now = new Date();

		if (status === "processing") {
			updateFields.paidAt = now;
		} else if (status === "delivered") {
			updateFields.deliveredAt = now;
		}

		try {
			const result = await this._db
				.findByIdAndUpdate(orderId, { $set: updateFields }, { new: true })
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
