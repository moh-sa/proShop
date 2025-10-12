import type { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	FailureResult,
	InsertReview,
	MethodParams,
	MethodReturn,
	Result,
	SelectReview,
} from "../types/index.js";

import Review from "../models/review.model.js";
import { handleDatabaseErrorResult, Paginator } from "../utils/index.js";

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
	getAll: () => Promise<ReviewResult<Array<SelectReview>>>;
	getAllByProductId: (data: {
		productId: Types.ObjectId;
	}) => Promise<ReviewResult<Array<SelectReview>>>;
	getAllByUserId: (data: {
		userId: Types.ObjectId;
	}) => Promise<ReviewResult<Array<SelectReview>>>;
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

	constructor(db: typeof Review = Review) {
		this._db = db;
		this._paginator = new Paginator(this._db);
	}

	async count(): MethodReturn<IReviewRepository, "count"> {
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

	async countByProductId({
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

	async countByUserId({
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

	async create(
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

	async delete({
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

	async existsById({
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

	async existsByUserIdAndProductId({
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

	async getAll(): MethodReturn<IReviewRepository, "getAll"> {
		try {
			const result = await this._db.find({}).lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getAllByProductId({
		productId,
	}: MethodParams<IReviewRepository, "getAllByProductId">): MethodReturn<
		IReviewRepository,
		"getAllByProductId"
	> {
		try {
			const result = await this._db.find({ product: productId }).lean();

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
	}: MethodParams<IReviewRepository, "getAllByUserId">): MethodReturn<
		IReviewRepository,
		"getAllByUserId"
	> {
		try {
			const result = await this._db.find({ user: userId }).lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getById({
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

	async update({
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
}
