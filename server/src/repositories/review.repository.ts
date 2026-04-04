import { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	FailureResult,
	GetAllReviewsByProductIdRepositoryParams,
	GetAllReviewsByUserIdRepositoryParams,
	GetAllReviewsRepositoryParams,
	InsertReview,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	PaginationQuery,
	Result,
	ReviewFilter,
	SelectReview,
} from "../types/index.js";
import type { PaginatorParams } from "../utils/index.js";

import Review from "../models/review.model.js";
import {
	buildMongoSelectProjection,
	handleDatabaseErrorResult,
	Paginator,
} from "../utils/index.js";

export interface IReviewRepository {
	count: () => Promise<ReviewResult<number>>;
	countByProductId: (data: {
		productId: Types.ObjectId;
	}) => Promise<ReviewResult<number>>;
	countByUserId: (data: {
		userId: Types.ObjectId;
	}) => Promise<ReviewResult<number>>;
	create: (data: InsertReview) => Promise<ReviewResult<SelectReview>>;
	delete: (data: {
		reviewId: Types.ObjectId;
	}) => Promise<ReviewResult<null | SelectReview>>;
	existsById: (data: {
		reviewId: Types.ObjectId;
	}) => Promise<ReviewResult<null | { _id: Types.ObjectId }>>;
	existsByUserIdAndProductId: (data: {
		productId: Types.ObjectId;
		userId: Types.ObjectId;
	}) => Promise<ReviewResult<null | { _id: Types.ObjectId }>>;
	getAll: (
		args: GetAllReviewsRepositoryParams,
	) => Promise<ReviewResult<PaginatedResponse<SelectReview>>>;
	getAllByProductId: (
		data: GetAllReviewsByProductIdRepositoryParams,
	) => Promise<ReviewResult<PaginatedResponse<SelectReview>>>;
	getAllByUserId: (
		data: GetAllReviewsByUserIdRepositoryParams,
	) => Promise<ReviewResult<PaginatedResponse<SelectReview>>>;
	getById: (data: {
		reviewId: Types.ObjectId;
	}) => Promise<ReviewResult<null | SelectReview>>;
	update: (data: {
		data: Partial<InsertReview>;
		reviewId: Types.ObjectId;
	}) => Promise<ReviewResult<null | SelectReview>>;
}

type ReviewResult<T> = Result<T, DatabaseBaseError>;

export class ReviewRepository implements IReviewRepository {
	private readonly _db: typeof Review;
	private _paginator: Paginator<SelectReview>;

	constructor(db?: typeof Review) {
		this._db = db ?? Review;
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
			const result = await this._paginateReviews(args);

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
			const result = await this._paginateReviews(args, {
				product: new Types.ObjectId(args.productId),
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
			const result = await this._paginateReviews(args, {
				user: new Types.ObjectId(args.userId),
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
				.findByIdAndUpdate(reviewId, data, { new: true })
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

	private _paginateReviews(
		args: GetAllReviewsRepositoryParams,
		query?: Partial<PaginationQuery<SelectReview>>,
	): Promise<PaginatedResponse<SelectReview>> {
		const paginateOptions: PaginatorParams<SelectReview> = {
			pageNumber: args.pageNumber,
			pageSize: args.pageSize,
		};

		if (args.filters) {
			const filters = this._prepareFilters(args.filters);
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

		return this._paginator.paginate<SelectReview>(paginateOptions);
	}

	private _prepareFilters(
		filters?: ReviewFilter,
	): Partial<PaginationQuery<SelectReview>> {
		if (!filters) {
			return {};
		}

		const newFilter: Partial<PaginationQuery<SelectReview>> = {};

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
