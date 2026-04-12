import { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
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
} from "../types/index.js";

import { ReviewModel } from "../models/review.model.js";
import { handleDatabaseErrorResult, Paginator } from "../utils/index.js";

export interface IReviewRepository {
	count: () => Promise<ReviewResult<number>>;
	countByProductId: (data: {
		productId: Types.ObjectId;
	}) => Promise<ReviewResult<number>>;
	countByUserId: (data: {
		userId: Types.ObjectId;
	}) => Promise<ReviewResult<number>>;
	create: (data: CreateReview) => Promise<ReviewResult<Review>>;
	delete: (data: {
		reviewId: Types.ObjectId;
	}) => Promise<ReviewResult<null | Review>>;
	existsById: (data: {
		reviewId: Types.ObjectId;
	}) => Promise<ReviewResult<null | { _id: Types.ObjectId }>>;
	existsByUserIdAndProductId: (data: {
		productId: Types.ObjectId;
		userId: Types.ObjectId;
	}) => Promise<ReviewResult<null | { _id: Types.ObjectId }>>;
	getAll: (
		args: GetAllReviewsRepositoryParams,
	) => Promise<ReviewResult<PaginatedResponse<Review>>>;
	getAllByProductId: (
		data: GetAllReviewsByProductIdRepositoryParams,
	) => Promise<ReviewResult<PaginatedResponse<Review>>>;
	getAllByUserId: (
		data: GetAllReviewsByUserIdRepositoryParams,
	) => Promise<ReviewResult<PaginatedResponse<Review>>>;
	getById: (data: {
		reviewId: Types.ObjectId;
	}) => Promise<ReviewResult<null | Review>>;
	update: (data: {
		data: Partial<CreateReview>;
		reviewId: Types.ObjectId;
	}) => Promise<ReviewResult<null | Review>>;
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
			const result = await this._db.countDocuments({ user: userId }).lean();

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
			const result = (await this._db.create(data)).toObject();

			return {
				data: result,
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
				data: result,
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
				data: result,
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
					user: userId,
				})
				.lean();

			return {
				data: result,
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
					user: new Types.ObjectId(args.userId),
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
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async update({
		data,
		reviewId,
	}: MethodParams<IReviewRepository, "update">): MethodReturn<
		IReviewRepository,
		"update"
	> {
		try {
			const result = await this._db
				.findByIdAndUpdate(reviewId, data, { returnDocument: "after" })
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
			newFilter.user = new Types.ObjectId(filters.userId);
		}

		return newFilter;
	}
}

export const reviewRepository = new ReviewRepository();
