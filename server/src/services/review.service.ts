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
	count: () => Promise<number>;
	countByProductId: (data: { productId: string }) => Promise<number>;
	countByUserId: (data: { userId: string }) => Promise<number>;
	create: (data: InsertReview) => Promise<SelectReview>;
	delete: (data: { reviewId: string }) => Promise<SelectReview>;
	existsById: (data: { reviewId: string }) => Promise<{ _id: Types.ObjectId }>;
	existsByUserIdAndProductId: (data: {
		productId: string;
		userId: string;
	}) => Promise<{ _id: Types.ObjectId }>;
	getAll: () => Promise<Array<SelectReview>>;
	getAllByProductId: (data: {
		productId: string;
	}) => Promise<Array<SelectReview>>;
	getAllByUserId: (data: { userId: string }) => Promise<Array<SelectReview>>;
	getById: (data: { reviewId: string }) => Promise<SelectReview>;
	update: (data: {
		data: Partial<InsertReview>;
		reviewId: string;
	}) => Promise<SelectReview>;
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
			throw result.error;
		}

		return result.data;
	}

	async countByProductId({
		productId,
	}: MethodParams<IReviewService, "countByProductId">): MethodReturn<
		IReviewService,
		"countByProductId"
	> {
		const validationResult = this._validateObjectId("productId", productId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const result = await this._repository.countByProductId({
			productId: validationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		return result.data;
	}

	async countByUserId({
		userId,
	}: MethodParams<IReviewService, "countByUserId">): MethodReturn<
		IReviewService,
		"countByUserId"
	> {
		const validationResult = this._validateObjectId("userId", userId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const result = await this._repository.countByUserId({
			userId: validationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		return result.data;
	}

	async create(
		data: MethodParams<IReviewService, "create">,
	): MethodReturn<IReviewService, "create"> {
		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const result = await this._repository.create(validationResult.data);
		if (!result.success) {
			throw result.error;
		}

		return result.data;
	}

	async delete({
		reviewId,
	}: MethodParams<IReviewService, "delete">): MethodReturn<
		IReviewService,
		"delete"
	> {
		const validationResult = this._validateObjectId("reviewId", reviewId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const result = await this._repository.delete({
			reviewId: validationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		if (!result.data) {
			throw new NotFoundError("Review");
		}

		return result.data;
	}

	async existsById({
		reviewId,
	}: MethodParams<IReviewService, "existsById">): MethodReturn<
		IReviewService,
		"existsById"
	> {
		const validationResult = this._validateObjectId("reviewId", reviewId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const result = await this._repository.existsById({
			reviewId: validationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		if (!result.data) {
			throw new NotFoundError("Review");
		}

		return result.data;
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
			throw productIdValidationResult.error;
		}

		const userIdValidationResult = this._validateObjectId("userId", userId);
		if (!userIdValidationResult.success) {
			throw userIdValidationResult.error;
		}

		const result = await this._repository.existsByUserIdAndProductId({
			productId: productIdValidationResult.data,
			userId: userIdValidationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		if (!result.data) {
			throw new NotFoundError("Review");
		}

		return result.data;
	}

	async getAll(): MethodReturn<IReviewService, "getAll"> {
		const result = await this._repository.getAll();
		if (!result.success) {
			throw result.error;
		}

		return result.data;
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
			throw productIdValidationResult.error;
		}

		const result = await this._repository.getAllByProductId({
			productId: productIdValidationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		return result.data;
	}

	async getAllByUserId({
		userId,
	}: MethodParams<IReviewService, "getAllByUserId">): MethodReturn<
		IReviewService,
		"getAllByUserId"
	> {
		const userIdValidationResult = this._validateObjectId("userId", userId);
		if (!userIdValidationResult.success) {
			throw userIdValidationResult.error;
		}

		const result = await this._repository.getAllByUserId({
			userId: userIdValidationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		return result.data;
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
			throw reviewIdValidationResult.error;
		}

		const result = await this._repository.getById({
			reviewId: reviewIdValidationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		if (!result.data) {
			throw new NotFoundError("Review");
		}

		return result.data;
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
			throw reviewIdValidationResult.error;
		}

		const updateDataValidationResult = this._validateUpdateData(data);
		if (!updateDataValidationResult.success) {
			throw updateDataValidationResult.error;
		}

		const result = await this._repository.update({
			data: updateDataValidationResult.data,
			reviewId: reviewIdValidationResult.data,
		});
		if (!result.success) {
			throw result.error;
		}

		if (!result.data) {
			throw new NotFoundError("Review");
		}

		return result.data;
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
