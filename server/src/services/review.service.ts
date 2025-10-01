import type { Types } from "mongoose";

import type { IReviewRepository } from "../repositories/index.js";
import type { InsertReview, Result, SelectReview } from "../types/index.js";

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

	async count(): Promise<number> {
		return await this._repository.count();
	}

	async countByProductId({
		productId,
	}: {
		productId: string;
	}): Promise<number> {
		const validationResult = this._validateObjectId("productId", productId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		return await this._repository.countByProductId({
			productId: validationResult.data,
		});
	}

	async countByUserId({ userId }: { userId: string }): Promise<number> {
		const validationResult = this._validateObjectId("userId", userId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		return await this._repository.countByUserId({
			userId: validationResult.data,
		});
	}

	async create(data: InsertReview): Promise<SelectReview> {
		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		return await this._repository.create(validationResult.data);
	}

	async delete({ reviewId }: { reviewId: string }): Promise<SelectReview> {
		const validationResult = this._validateObjectId("reviewId", reviewId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const deletedReview = await this._repository.delete({
			reviewId: validationResult.data,
		});
		if (!deletedReview) {
			throw new NotFoundError("Review");
		}

		return deletedReview;
	}

	async existsById({
		reviewId,
	}: {
		reviewId: string;
	}): Promise<{ _id: Types.ObjectId }> {
		const validationResult = this._validateObjectId("reviewId", reviewId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const exists = await this._repository.existsById({
			reviewId: validationResult.data,
		});
		if (!exists) {
			throw new NotFoundError("Review");
		}

		return exists;
	}

	async existsByUserIdAndProductId({
		productId,
		userId,
	}: {
		productId: string;
		userId: string;
	}): Promise<{ _id: Types.ObjectId }> {
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

		const exists = await this._repository.existsByUserIdAndProductId({
			productId: productIdValidationResult.data,
			userId: userIdValidationResult.data,
		});
		if (!exists) {
			throw new NotFoundError("Review");
		}

		return exists;
	}

	async getAll(): Promise<Array<SelectReview>> {
		return await this._repository.getAll();
	}

	async getAllByProductId({
		productId,
	}: {
		productId: string;
	}): Promise<Array<SelectReview>> {
		const productIdValidationResult = this._validateObjectId(
			"productId",
			productId,
		);
		if (!productIdValidationResult.success) {
			throw productIdValidationResult.error;
		}

		return await this._repository.getAllByProductId({
			productId: productIdValidationResult.data,
		});
	}

	async getAllByUserId({
		userId,
	}: {
		userId: string;
	}): Promise<Array<SelectReview>> {
		const userIdValidationResult = this._validateObjectId("userId", userId);
		if (!userIdValidationResult.success) {
			throw userIdValidationResult.error;
		}

		return await this._repository.getAllByUserId({
			userId: userIdValidationResult.data,
		});
	}

	async getById({ reviewId }: { reviewId: string }): Promise<SelectReview> {
		const reviewIdValidationResult = this._validateObjectId(
			"reviewId",
			reviewId,
		);
		if (!reviewIdValidationResult.success) {
			throw reviewIdValidationResult.error;
		}

		const review = await this._repository.getById({
			reviewId: reviewIdValidationResult.data,
		});
		if (!review) {
			throw new NotFoundError("Review");
		}

		return review;
	}

	async update({
		data,
		reviewId,
	}: {
		data: Partial<InsertReview>;
		reviewId: string;
	}): Promise<SelectReview> {
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

		const updatedReview = await this._repository.update({
			data: updateDataValidationResult.data,
			reviewId: reviewIdValidationResult.data,
		});
		if (!updatedReview) {
			throw new NotFoundError("Review");
		}

		return updatedReview;
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
