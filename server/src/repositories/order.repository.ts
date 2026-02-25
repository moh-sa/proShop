import type { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	AllOrdersResponse,
	FailureResult,
	InsertOrder,
	MarkAsCancelledParams,
	MarkAsProcessingParams,
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

	constructor(db: typeof Order = Order) {
		this._db = db;
		this._paginator = new Paginator(this._db);
	}

	async create(
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

	async getAll(
		args: MethodParams<IOrderRepository, "getAll">,
	): MethodReturn<IOrderRepository, "getAll"> {
		const queries = this._bindQuery(args);

		try {
			const result = await this._paginator.paginate<AllOrdersResponse>({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				pipeline: args.pipeline,
				query: queries,
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
			const result = await this._db.findById(orderId).lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async markAsCancelled(
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

	async markAsProcessing(
		params: MethodParams<IOrderRepository, "markAsProcessing">,
	): MethodReturn<IOrderRepository, "markAsProcessing"> {
		try {
			const result = await this._db
				.findByIdAndUpdate(
					params.orderId,
					{
						$set: {
							paidAt: params.paidAt,
							"payment.provider": params.provider,
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

	async updatePayment(
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

	private _bindQuery(args: PaginationParamsQuery<SelectOrder>) {
		const query: Record<string, unknown> = {};

		if (args.query?.user) {
			query["user._id"] = args.query.user;
		}

		if (args.query?.status) {
			query.status = args.query.status;
		}

		return query;
	}

	private _errorHandler(error: unknown): FailureResult<DatabaseBaseError> {
		return handleDatabaseErrorResult(error);
	}
}
