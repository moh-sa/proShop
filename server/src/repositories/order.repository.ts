import { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	AllOrdersResponse,
	FailureResult,
	GetAllOrdersRepositoryParams,
	InsertOrder,
	MarkAsCancelledParams,
	MarkAsProcessingParams,
	MethodParams,
	MethodReturn,
	OrderFilter,
	PaginatedResponse,
	PaginationQuery,
	Result,
	SelectOrder,
} from "../types/index.js";
import type { PaginatorParams } from "../utils/index.js";

import Order from "../models/order.model.js";
import {
	buildMongoSelectProjection,
	handleDatabaseErrorResult,
	Paginator,
} from "../utils/index.js";

export interface IOrderRepository {
	create(data: InsertOrder): Promise<OrderResult<SelectOrder>>;
	getAll(
		args: GetAllOrdersRepositoryParams,
	): Promise<OrderResult<PaginatedResponse<AllOrdersResponse>>>;
	getById({
		orderId,
	}: {
		orderId: Types.ObjectId;
	}): Promise<OrderResult<null | SelectOrder>>;
	markAsCancelled(
		params: MarkAsCancelledParams,
	): Promise<OrderResult<null | SelectOrder>>;
	markAsProcessing(
		params: MarkAsProcessingParams,
	): Promise<OrderResult<null | SelectOrder>>;
	updatePayment(
		params: Partial<SelectOrder["payment"]> & { orderId: Types.ObjectId },
	): Promise<OrderResult<null | SelectOrder>>;
}

type OrderResult<T> = Result<T, DatabaseBaseError>;

export class OrderRepository implements IOrderRepository {
	private readonly _db: typeof Order;
	private _paginator: Paginator<SelectOrder>;

	constructor(db?: typeof Order) {
		this._db = db ?? Order;
		this._paginator = new Paginator(this._db);
	}

	public async create(
		data: MethodParams<IOrderRepository, "create">,
	): MethodReturn<IOrderRepository, "create"> {
		try {
			const order = await this._db.create(data);
			return {
				data: order.toObject(),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAll(
		args: MethodParams<IOrderRepository, "getAll">,
	): MethodReturn<IOrderRepository, "getAll"> {
		try {
			const result = await this._paginateOrders(args);

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getById({
		orderId,
	}: MethodParams<IOrderRepository, "getById">): MethodReturn<
		IOrderRepository,
		"getById"
	> {
		try {
			const result = await this._db.findById(orderId).lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async markAsCancelled(
		params: MethodParams<IOrderRepository, "markAsCancelled">,
	): MethodReturn<IOrderRepository, "markAsCancelled"> {
		try {
			const result = await this._db
				.findByIdAndUpdate(
					params.orderId,
					{
						$set: {
							status: "cancelled",
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

	public async markAsProcessing(
		params: MethodParams<IOrderRepository, "markAsProcessing">,
	): MethodReturn<IOrderRepository, "markAsProcessing"> {
		try {
			const result = await this._db
				.findByIdAndUpdate(
					params.orderId,
					{
						$set: {
							"payment.paidAt": params.paidAt,
							status: "processing",
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

	public async updatePayment(
		params: MethodParams<IOrderRepository, "updatePayment">,
	): MethodReturn<IOrderRepository, "updatePayment"> {
		const { orderId, ...rest } = params;

		const updateFields: Record<string, unknown> = {};
		Object.entries(rest).forEach(([key, value]) => {
			if (value) {
				updateFields[`payment.${key}`] = value;
			}
		});

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

	private async _paginateOrders(
		args: GetAllOrdersRepositoryParams,
		query?: Partial<PaginationQuery<SelectOrder>>,
	): Promise<PaginatedResponse<SelectOrder>> {
		const paginateOptions: PaginatorParams<SelectOrder> = {
			pageNumber: args.pageNumber,
			pageSize: args.pageSize,
		};

		if (args.filters) {
			const filters = this._prepareFilter(args.filters);
			paginateOptions.query = { ...filters };
		}

		if (query) {
			paginateOptions.query = { ...paginateOptions.query, ...query };
		}

		if (args.select) {
			const select = buildMongoSelectProjection(args.select);
			paginateOptions.pipeline = [{ $project: select }];
		}

		if (args.sort) {
			paginateOptions.sort = args.sort;
		}

		return this._paginator.paginate<SelectOrder>(paginateOptions);
	}

	private _prepareFilter(
		filters?: OrderFilter,
	): Partial<PaginationQuery<SelectOrder>> {
		if (!filters) {
			return {};
		}

		const newFilter: Partial<PaginationQuery<SelectOrder>> = {};

		if (filters.userId) {
			// mongo doesn't cast in aggregate queries
			const id = new Types.ObjectId(filters.userId);
			newFilter["user._id"] = id;
		}

		if (filters.status) {
			newFilter.status = filters.status;
		}

		return newFilter;
	}
}

export const orderRepository = new OrderRepository();
