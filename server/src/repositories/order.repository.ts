import type { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	AllOrdersResponse,
	FailureResult,
	InsertOrder,
	MethodParams,
	MethodReturn,
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
	private _paginator: Paginator<SelectOrder>;

	constructor(db: typeof Order = Order) {
		this._db = db;
		this._paginator = new Paginator(this._db);
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

	async getAll(
		args: MethodParams<IOrderRepository, "getAll">,
	): MethodReturn<IOrderRepository, "getAll"> {
		try {
			// _id createdAt isPaid paidAt isDelivered deliveredAt totalPrice user

			const result = await this._paginator.paginate<AllOrdersResponse>({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
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
