import type { Types } from "mongoose";

import type { IReviewRepository } from "../repositories/index.js";
import type {
	InsertReview,
	MethodParams,
	MethodReturn,
	Result,
	SelectReview,
} from "../types/index.js";

import { NotFoundError, ValidationError } from "../errors/index.js";
import { ReviewRepository } from "../repositories/index.js";
import { insertReviewSchema } from "../schemas/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IReviewService {
	count: () => Promise<ReviewResult<number>>;
	countByProductId: (data: {
		productId: string;
	}) => Promise<ReviewResult<number>>;
	countByUserId: (data: { userId: string }) => Promise<ReviewResult<number>>;
	create: (data: InsertReview) => Promise<ReviewResult<SelectReview>>;
	delete: (data: { reviewId: string }) => Promise<ReviewResult<SelectReview>>;
	existsById: (data: {
		reviewId: string;
	}) => Promise<ReviewResult<{ _id: Types.ObjectId }>>;
	existsByUserIdAndProductId: (data: {
		productId: string;
		userId: string;
	}) => Promise<ReviewResult<{ _id: Types.ObjectId }>>;
	getAll: () => Promise<ReviewResult<Array<SelectReview>>>;
	getAllByProductId: (data: {
		productId: string;
	}) => Promise<ReviewResult<Array<SelectReview>>>;
	getAllByUserId: (data: {
		userId: string;
	}) => Promise<ReviewResult<Array<SelectReview>>>;
	getById: (data: { reviewId: string }) => Promise<ReviewResult<SelectReview>>;
	update: (data: {
		data: Partial<InsertReview>;
		reviewId: string;
	}) => Promise<ReviewResult<SelectReview>>;
}

type ReviewResult<T> = Result<T>;

export class ReviewService implements IReviewService {
	private readonly _repository: IReviewRepository;

	constructor(repository: IReviewRepository = new ReviewRepository()) {
		this._repository = repository;
	}

	async count(): MethodReturn<IReviewService, "count"> {
		const result = await this._repository.count();
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async countByProductId({
		productId,
	}: MethodParams<IReviewService, "countByProductId">): MethodReturn<
		IReviewService,
		"countByProductId"
	> {
		const validationResult = this._validateObjectId("productId", productId);
		if (!validationResult.success) {
			return validationResult;
		}

		const result = await this._repository.countByProductId({
			productId: validationResult.data,
		});
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async countByUserId({
		userId,
	}: MethodParams<IReviewService, "countByUserId">): MethodReturn<
		IReviewService,
		"countByUserId"
	> {
		const validationResult = this._validateObjectId("userId", userId);
		if (!validationResult.success) {
			return validationResult;
		}

		const result = await this._repository.countByUserId({
			userId: validationResult.data,
		});
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async create(
		data: MethodParams<IReviewService, "create">,
	): MethodReturn<IReviewService, "create"> {
		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			return validationResult;
		}

		const result = await this._repository.create(validationResult.data);
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async delete({
		reviewId,
	}: MethodParams<IReviewService, "delete">): MethodReturn<
		IReviewService,
		"delete"
	> {
		const validationResult = this._validateObjectId("reviewId", reviewId);
		if (!validationResult.success) {
			return validationResult;
		}

		const result = await this._repository.delete({
			reviewId: validationResult.data,
		});
		if (!result.success) {
			return result;
		}

		if (!result.data) {
			return {
				error: new NotFoundError("Review"),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async existsById({
		reviewId,
	}: MethodParams<IReviewService, "existsById">): MethodReturn<
		IReviewService,
		"existsById"
	> {
		const validationResult = this._validateObjectId("reviewId", reviewId);
		if (!validationResult.success) {
			return validationResult;
		}

		const result = await this._repository.existsById({
			reviewId: validationResult.data,
		});
		if (!result.success) {
			return result;
		}

		if (!result.data) {
			return {
				error: new NotFoundError("Review"),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async existsByUserIdAndProductId({
		productId,
		userId,
	}: MethodParams<IReviewService, "existsByUserIdAndProductId">): MethodReturn<
		IReviewService,
		"existsByUserIdAndProductId"
	> {
		const productIdValidationResult = this._validateObjectId(
			"productId",
			productId,
		);
		if (!productIdValidationResult.success) {
			return productIdValidationResult;
		}

		const userIdValidationResult = this._validateObjectId("userId", userId);
		if (!userIdValidationResult.success) {
			return userIdValidationResult;
		}

		const result = await this._repository.existsByUserIdAndProductId({
			productId: productIdValidationResult.data,
			userId: userIdValidationResult.data,
		});
		if (!result.success) {
			return result;
		}

		if (!result.data) {
			return {
				error: new NotFoundError("Review"),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async getAll(): MethodReturn<IReviewService, "getAll"> {
		const result = await this._repository.getAll();
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async getAllByProductId({
		productId,
	}: MethodParams<IReviewService, "getAllByProductId">): MethodReturn<
		IReviewService,
		"getAllByProductId"
	> {
		const productIdValidationResult = this._validateObjectId(
			"productId",
			productId,
		);
		if (!productIdValidationResult.success) {
			return productIdValidationResult;
		}

		const result = await this._repository.getAllByProductId({
			productId: productIdValidationResult.data,
		});
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async getAllByUserId({
		userId,
	}: MethodParams<IReviewService, "getAllByUserId">): MethodReturn<
		IReviewService,
		"getAllByUserId"
	> {
		const userIdValidationResult = this._validateObjectId("userId", userId);
		if (!userIdValidationResult.success) {
			return userIdValidationResult;
		}

		const result = await this._repository.getAllByUserId({
			userId: userIdValidationResult.data,
		});
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async getById({
		reviewId,
	}: MethodParams<IReviewService, "getById">): MethodReturn<
		IReviewService,
		"getById"
	> {
		const reviewIdValidationResult = this._validateObjectId(
			"reviewId",
			reviewId,
		);
		if (!reviewIdValidationResult.success) {
			return reviewIdValidationResult;
		}

		const result = await this._repository.getById({
			reviewId: reviewIdValidationResult.data,
		});
		if (!result.success) {
			return result;
		}

		if (!result.data) {
			return {
				error: new NotFoundError("Review"),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	async update({
		data,
		reviewId,
	}: MethodParams<IReviewService, "update">): MethodReturn<
		IReviewService,
		"update"
	> {
		const reviewIdValidationResult = this._validateObjectId(
			"reviewId",
			reviewId,
		);
		if (!reviewIdValidationResult.success) {
			return reviewIdValidationResult;
		}

		const updateDataValidationResult = this._validateUpdateData(data);
		if (!updateDataValidationResult.success) {
			return updateDataValidationResult;
		}

		const result = await this._repository.update({
			data: updateDataValidationResult.data,
			reviewId: reviewIdValidationResult.data,
		});
		if (!result.success) {
			return result;
		}

		if (!result.data) {
			return {
				error: new NotFoundError("Review"),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	private _validateCreateData(data: InsertReview): ReviewResult<InsertReview> {
		const result = insertReviewSchema.safeParse(data);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid review data", {
					cause: result.error,
				}),
				success: false,
			};
		}
		return { data: result.data, success: true };
	}

	private _validateObjectId(
		field: string,
		id: string,
	): ReviewResult<Types.ObjectId> {
		const result = objectIdValidator.safeParse(id);
		if (!result.success) {
			return {
				error: new ValidationError(`Invalid ${field}`, { cause: result.error }),
				success: false,
			};
		}
		return { data: result.data, success: true };
	}

	private _validateUpdateData(
		data: Partial<InsertReview>,
	): ReviewResult<Partial<InsertReview>> {
		const result = insertReviewSchema.partial().safeParse(data);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid review data", {
					cause: result.error,
				}),
				success: false,
			};
		}
		return { data: result.data, success: true };
	}
}
