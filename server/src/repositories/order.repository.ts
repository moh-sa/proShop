import { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	AllOrdersResponse,
	CreateOrder,
	FailureResult,
	GetAllOrdersRepositoryParams,
	MarkAsCancelledParams,
	MarkAsProcessingParams,
	MethodParams,
	MethodReturn,
	Order,
	OrderFilter,
	OrderSchema,
	PaginatedResponse,
	PaginationQuery,
	Result,
} from "../types/index.js";

import { OrderModel } from "../models/order.model.js";
import {
	handleDatabaseErrorResult,
	Paginator,
	serializeMongoResult,
} from "../utils/index.js";

export interface IOrderRepository {
	create(data: CreateOrder): Promise<OrderResult<Order>>;
	getAll(
		args: GetAllOrdersRepositoryParams,
	): Promise<OrderResult<PaginatedResponse<AllOrdersResponse>>>;
	getById({ orderId }: { orderId: string }): Promise<OrderResult<null | Order>>;
	markAsCancelled(
		params: MarkAsCancelledParams,
	): Promise<OrderResult<null | Order>>;
	markAsProcessing(
		params: MarkAsProcessingParams,
	): Promise<OrderResult<null | Order>>;
	updatePayment(
		params: Partial<Order["payment"]> & { orderId: string },
	): Promise<OrderResult<null | Order>>;
}

type OrderResult<T> = Result<T, DatabaseBaseError>;

export class OrderRepository implements IOrderRepository {
	private readonly _db: typeof OrderModel;
	private _paginator: Paginator<OrderSchema, Order>;

	constructor(db?: typeof OrderModel) {
		this._db = db ?? OrderModel;
		this._paginator = new Paginator(this._db);
	}

	public async create(
		data: MethodParams<IOrderRepository, "create">,
	): MethodReturn<IOrderRepository, "create"> {
		try {
			const order = await this._db.create(data);

			return {
				data: serializeMongoResult(order.toObject()),
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
			const result = await this._paginator.paginate<AllOrdersResponse>({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: args.filters && this._prepareFilter(args.filters),
				select: args.select,
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

	public async getById({
		orderId,
	}: MethodParams<IOrderRepository, "getById">): MethodReturn<
		IOrderRepository,
		"getById"
	> {
		try {
			const result = await this._db.findById(orderId).lean();

			return {
				data: serializeMongoResult(result),
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
					{ returnDocument: "after" },
				)
				.lean();

			return {
				data: serializeMongoResult(result),
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
					{ returnDocument: "after" },
				)
				.lean();

			return {
				data: serializeMongoResult(result),
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
				.findByIdAndUpdate(
					orderId,
					{ $set: updateFields },
					{ returnDocument: "after" },
				)
				.lean();

			return {
				data: serializeMongoResult(result),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): FailureResult<DatabaseBaseError> {
		return handleDatabaseErrorResult(error);
	}

	private _prepareFilter(
		filters?: OrderFilter,
	): Partial<PaginationQuery<OrderSchema>> {
		if (!filters) {
			return {};
		}

		const newFilter: Partial<PaginationQuery<OrderSchema>> = {};

		if (filters.userId) {
			// mongo doesn't cast in aggregate queries
			newFilter["user.id"] = new Types.ObjectId(filters.userId);
		}

		if (filters.status) {
			newFilter.status = filters.status;
		}

		return newFilter;
	}
}

export const orderRepository = new OrderRepository();
