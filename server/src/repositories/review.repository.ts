import { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import { ReviewModel } from "../models/review.model.js";
import type {
	CreateReview,
	FailureResult,
	GetAllReviewsByProductIdRepositoryParams,
	GetAllReviewsByUserIdRepositoryParams,
	GetAllReviewsRepositoryParams,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	PaginationQuery,
	Result,
	Review,
	ReviewFilter,
	ReviewSchema,
	UpdateReviewInput,
} from "../types/index.js";
import {
	handleDatabaseErrorResult,
	Paginator,
	serializeMongoResult,
} from "../utils/index.js";

export interface IReviewRepository {
	count: () => Promise<ReviewResult<number>>;
	countByProductId: (data: {
		productId: string;
	}) => Promise<ReviewResult<number>>;
	countByUserId: (data: { userId: string }) => Promise<ReviewResult<number>>;
	create: (data: CreateReview) => Promise<ReviewResult<Review>>;
	delete: (data: { reviewId: string }) => Promise<ReviewResult<null | Review>>;
	existsById: (data: {
		reviewId: string;
	}) => Promise<ReviewResult<null | { id: string }>>;
	existsByUserIdAndProductId: (data: {
		productId: string;
		userId: string;
	}) => Promise<ReviewResult<null | { id: string }>>;
	getAll: (
		args: GetAllReviewsRepositoryParams,
	) => Promise<ReviewResult<PaginatedResponse<Review>>>;
	getAllByProductId: (
		data: GetAllReviewsByProductIdRepositoryParams,
	) => Promise<ReviewResult<PaginatedResponse<Review>>>;
	getAllByUserId: (
		data: GetAllReviewsByUserIdRepositoryParams,
	) => Promise<ReviewResult<PaginatedResponse<Review>>>;
	getById: (data: { reviewId: string }) => Promise<ReviewResult<null | Review>>;
	update: (args: UpdateReviewInput) => Promise<ReviewResult<null | Review>>;
}

type ReviewResult<T> = Result<T, DatabaseBaseError>;

export class ReviewRepository implements IReviewRepository {
	private readonly _db: typeof ReviewModel;
	private _paginator: Paginator<ReviewSchema, Review>;

	constructor(db?: typeof ReviewModel) {
		this._db = db ?? ReviewModel;
		this._paginator = new Paginator(this._db);
	}

	public async count(): MethodReturn<IReviewRepository, "count"> {
		try {
			const result = await this._db.countDocuments().lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async countByProductId({
		productId,
	}: MethodParams<IReviewRepository, "countByProductId">): MethodReturn<
		IReviewRepository,
		"countByProductId"
	> {
		try {
			const result = await this._db
				.countDocuments({ product: productId })
				.lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async countByUserId({
		userId,
	}: MethodParams<IReviewRepository, "countByUserId">): MethodReturn<
		IReviewRepository,
		"countByUserId"
	> {
		try {
			const result = await this._db
				.countDocuments({ "user.id": userId })
				.lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async create(
		data: MethodParams<IReviewRepository, "create">,
	): MethodReturn<IReviewRepository, "create"> {
		try {
			const result = await this._db.create(data);

			return {
				data: serializeMongoResult(result.toObject()),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async delete({
		reviewId,
	}: MethodParams<IReviewRepository, "delete">): MethodReturn<
		IReviewRepository,
		"delete"
	> {
		try {
			const result = await this._db.findByIdAndDelete(reviewId).lean();

			return {
				data: serializeMongoResult(result),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async existsById({
		reviewId,
	}: MethodParams<IReviewRepository, "existsById">): MethodReturn<
		IReviewRepository,
		"existsById"
	> {
		try {
			const result = await this._db
				.exists({
					_id: reviewId,
				})
				.lean();

			return {
				data: serializeMongoResult(result),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async existsByUserIdAndProductId({
		productId,
		userId,
	}: MethodParams<
		IReviewRepository,
		"existsByUserIdAndProductId"
	>): MethodReturn<IReviewRepository, "existsByUserIdAndProductId"> {
		try {
			const result = await this._db
				.exists({
					product: productId,
					"user.id": userId,
				})
				.lean();

			return {
				data: serializeMongoResult(result),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAll(
		args: MethodParams<IReviewRepository, "getAll">,
	): MethodReturn<IReviewRepository, "getAll"> {
		try {
			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: args.filters && this._prepareFilters(args.filters),
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

	public async getAllByProductId(
		args: MethodParams<IReviewRepository, "getAllByProductId">,
	): MethodReturn<IReviewRepository, "getAllByProductId"> {
		try {
			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: {
					...(args.filters && this._prepareFilters(args.filters)),
					product: new Types.ObjectId(args.productId),
				},
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

	public async getAllByUserId(
		args: MethodParams<IReviewRepository, "getAllByUserId">,
	): MethodReturn<IReviewRepository, "getAllByUserId"> {
		try {
			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: {
					...(args.filters && this._prepareFilters(args.filters)),
					"user.id": new Types.ObjectId(args.userId),
				},
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
		reviewId,
	}: MethodParams<IReviewRepository, "getById">): MethodReturn<
		IReviewRepository,
		"getById"
	> {
		try {
			const result = await this._db.findById(reviewId).lean();

			return {
				data: serializeMongoResult(result),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async update({
		reviewId,
		...data
	}: MethodParams<IReviewRepository, "update">): MethodReturn<
		IReviewRepository,
		"update"
	> {
		try {
			const result = await this._db
				.findByIdAndUpdate(reviewId, data, {
					returnDocument: "after",
					runValidators: true,
				})
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

	private _prepareFilters(
		filters?: ReviewFilter,
	): Partial<PaginationQuery<ReviewSchema>> {
		if (!filters) {
			return {};
		}

		const newFilter: Partial<PaginationQuery<ReviewSchema>> = {};

		if (filters.productId) {
			newFilter.product = new Types.ObjectId(filters.productId);
		}

		if (filters.userId) {
			newFilter["user.id"] = new Types.ObjectId(filters.userId);
		}

		return newFilter;
	}
}

export const reviewRepository = new ReviewRepository();
