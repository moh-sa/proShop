import type { Types } from "mongoose";

import type { IReviewRepository } from "../repositories/index.js";
import type {
	CreateReview,
	GetAllReviewsByProductIdServiceParams,
	GetAllReviewsByUserIdServiceParams,
	GetAllReviewsServiceParams,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	Result,
	Review,
} from "../types/index.js";

import { NotFoundError, ValidationError } from "../errors/index.js";
import { reviewRepository } from "../repositories/index.js";
import { createReviewSchema } from "../schemas/index.js";
import {
	reviewByProductIdPaginationParamsSchema,
	reviewByUserIdPaginationParamsSchema,
	reviewPaginationParamsSchema,
} from "../schemas/review/review-pagination.schema.js";
import { getLoggerFromContext } from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IReviewService {
	count: () => Promise<ReviewResult<number>>;
	countByProductId: (data: {
		productId: string;
	}) => Promise<ReviewResult<number>>;
	countByUserId: (data: { userId: string }) => Promise<ReviewResult<number>>;
	create: (data: CreateReview) => Promise<ReviewResult<Review>>;
	delete: (data: { reviewId: string }) => Promise<ReviewResult<Review>>;
	existsById: (data: {
		reviewId: string;
	}) => Promise<ReviewResult<{ _id: Types.ObjectId }>>;
	existsByUserIdAndProductId: (data: {
		productId: string;
		userId: string;
	}) => Promise<ReviewResult<{ _id: Types.ObjectId }>>;
	getAll: (
		args: GetAllReviewsServiceParams,
	) => Promise<ReviewResult<PaginatedResponse<Review>>>;
	getAllByProductId: (
		args: GetAllReviewsByProductIdServiceParams,
	) => Promise<ReviewResult<PaginatedResponse<Review>>>;
	getAllByUserId: (
		args: GetAllReviewsByUserIdServiceParams,
	) => Promise<ReviewResult<PaginatedResponse<Review>>>;
	getById: (data: { reviewId: string }) => Promise<ReviewResult<Review>>;
	update: (data: {
		data: Partial<CreateReview>;
		reviewId: string;
	}) => Promise<ReviewResult<Review>>;
}

type ReviewResult<T> = Result<T>;

export class ReviewService implements IReviewService {
	private readonly _repository: IReviewRepository;

	constructor(repository?: IReviewRepository) {
		this._repository = repository ?? reviewRepository;
	}

	public async count(): MethodReturn<IReviewService, "count"> {
		const logger = this._getLogger({ method: "count" });
		logger.debug("Counting reviews");

		const result = await this._repository.count();
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to count reviews");
			return result;
		}

		logger.debug({ totalReviews: result.data }, "Reviews counted successfully");
		return {
			data: result.data,
			success: true,
		};
	}

	public async countByProductId({
		productId,
	}: MethodParams<IReviewService, "countByProductId">): MethodReturn<
		IReviewService,
		"countByProductId"
	> {
		const logger = this._getLogger({ method: "countByProductId" });
		logger.debug({ productId }, "Counting reviews by product ID");

		const validationResult = this._validateObjectId("productId", productId);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error },
				"product ID validation failed",
			);
			return validationResult;
		}

		logger.debug(
			{ validatedProductId: validationResult.data },
			"Validated product ID",
		);

		const result = await this._repository.countByProductId({
			productId: validationResult.data,
		});
		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to count reviews by product ID",
			);
			return result;
		}

		logger.debug(
			{ totalReviews: result.data },
			"Reviews counted by product ID successfully",
		);

		return {
			data: result.data,
			success: true,
		};
	}

	public async countByUserId({
		userId,
	}: MethodParams<IReviewService, "countByUserId">): MethodReturn<
		IReviewService,
		"countByUserId"
	> {
		const logger = this._getLogger({ method: "countByUserId" });
		logger.debug({ userId }, "Counting reviews by user ID");

		const validationResult = this._validateObjectId("userId", userId);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error },
				"user ID validation failed",
			);
			return validationResult;
		}

		logger.debug(
			{ validatedUserId: validationResult.data },
			"Validated user ID",
		);

		const result = await this._repository.countByUserId({
			userId: validationResult.data,
		});
		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to count reviews by user ID",
			);
			return result;
		}

		logger.debug(
			{ totalReviews: result.data },
			"Reviews counted by user ID successfully",
		);

		return {
			data: result.data,
			success: true,
		};
	}

	public async create(
		data: MethodParams<IReviewService, "create">,
	): MethodReturn<IReviewService, "create"> {
		const logger = this._getLogger({ method: "create" });
		logger.debug({ data }, "Creating review");

		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error },
				"Create review data validation failed",
			);
			return validationResult;
		}

		logger.debug(
			{ validatedData: validationResult.data },
			"Validated review data",
		);

		const result = await this._repository.create(validationResult.data);
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to create review");
			return result;
		}

		logger.info(
			{
				productId: result.data.product,
				reviewId: result.data._id,
				userId: result.data.user,
			},
			"Review created successfully",
		);
		return {
			data: result.data,
			success: true,
		};
	}

	public async delete({
		reviewId,
	}: MethodParams<IReviewService, "delete">): MethodReturn<
		IReviewService,
		"delete"
	> {
		const logger = this._getLogger({ method: "delete" });
		logger.debug({ reviewId }, "Deleting review");

		const validationResult = this._validateObjectId("reviewId", reviewId);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error, reviewId },
				"review ID validation failed",
			);
			return validationResult;
		}

		logger.debug(
			{ validatedReviewId: validationResult.data },
			"Validated review ID",
		);

		const result = await this._repository.delete({
			reviewId: validationResult.data,
		});
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to delete review");
			return result;
		}

		if (!result.data) {
			logger.warn({ reviewId }, "Review not found");
			return {
				error: new NotFoundError("Review"),
				success: false,
			};
		}

		logger.info({ reviewId }, "Review deleted successfully");
		return {
			data: result.data,
			success: true,
		};
	}

	public async existsById({
		reviewId,
	}: MethodParams<IReviewService, "existsById">): MethodReturn<
		IReviewService,
		"existsById"
	> {
		const logger = this._getLogger({ method: "existsById" });
		logger.debug({ reviewId }, "Checking if review exists by ID");

		const validationResult = this._validateObjectId("reviewId", reviewId);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error, reviewId },
				"review ID validation failed",
			);
			return validationResult;
		}

		logger.debug(
			{ validatedReviewId: validationResult.data },
			"Validated review ID",
		);

		const result = await this._repository.existsById({
			reviewId: validationResult.data,
		});
		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to check if review exists by ID",
			);
			return result;
		}

		if (!result.data) {
			logger.warn({ reviewId }, "Review not found");
			return {
				error: new NotFoundError("Review"),
				success: false,
			};
		}

		logger.info({ reviewId }, "Review exists by ID successfully");

		return {
			data: result.data,
			success: true,
		};
	}

	public async existsByUserIdAndProductId({
		productId,
		userId,
	}: MethodParams<IReviewService, "existsByUserIdAndProductId">): MethodReturn<
		IReviewService,
		"existsByUserIdAndProductId"
	> {
		const logger = this._getLogger({ method: "existsByUserIdAndProductId" });
		logger.debug(
			{ productId, userId },
			"Checking if review exists by user ID and product ID",
		);

		const productIdValidationResult = this._validateObjectId(
			"productId",
			productId,
		);
		if (!productIdValidationResult.success) {
			logger.warn(
				{ error: productIdValidationResult.error, productId },
				"product ID validation failed",
			);
			return productIdValidationResult;
		}

		const userIdValidationResult = this._validateObjectId("userId", userId);
		if (!userIdValidationResult.success) {
			logger.warn(
				{ error: userIdValidationResult.error, userId },
				"user ID validation failed",
			);
			return userIdValidationResult;
		}

		const result = await this._repository.existsByUserIdAndProductId({
			productId: productIdValidationResult.data,
			userId: userIdValidationResult.data,
		});
		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to check if review exists by user ID and product ID",
			);
			return result;
		}

		if (!result.data) {
			logger.warn({ productId, userId }, "Review not found");
			return {
				error: new NotFoundError("Review"),
				success: false,
			};
		}

		logger.info(
			{ productId, userId },
			"Review exists by user ID and product ID successfully",
		);

		return {
			data: result.data,
			success: true,
		};
	}

	public async getAll(
		args: MethodParams<IReviewService, "getAll">,
	): MethodReturn<IReviewService, "getAll"> {
		const logger = this._getLogger({ method: "getAll" });
		logger.debug({ args }, "Getting all reviews");

		// validate arguments
		const argsValidationResult = reviewPaginationParamsSchema.safeParse(args);
		if (!argsValidationResult.success) {
			logger.warn(argsValidationResult.error, "Invalid arguments data");
			return {
				error: new ValidationError("Invalid arguments data", {
					cause: argsValidationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedArgs: argsValidationResult.data },
			"Validated arguments data",
		);

		// repository call
		const result = await this._repository.getAll(argsValidationResult.data);
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to get all reviews");
			return result;
		}

		logger.info(
			{ totalReviews: result.data.meta.totalItems },
			"Reviews retrieved successfully",
		);

		return {
			data: result.data,
			success: true,
		};
	}

	public async getAllByProductId(
		args: MethodParams<IReviewService, "getAllByProductId">,
	): MethodReturn<IReviewService, "getAllByProductId"> {
		const logger = this._getLogger({ method: "getAllByProductId" });
		logger.debug({ args }, "Getting all reviews by product ID");

		// validate arguments
		const argsValidationResult =
			reviewByProductIdPaginationParamsSchema.safeParse(args);
		if (!argsValidationResult.success) {
			logger.warn(argsValidationResult.error, "Invalid arguments data");
			return {
				error: new ValidationError("Invalid arguments data", {
					cause: argsValidationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedArgs: argsValidationResult.data },
			"Validated arguments data",
		);

		// repository call

		const result = await this._repository.getAllByProductId(
			argsValidationResult.data,
		);
		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to get all reviews by product ID",
			);
			return result;
		}

		logger.info(
			{ totalReviews: result.data.meta.totalItems },
			"Reviews retrieved by product ID successfully",
		);

		return {
			data: result.data,
			success: true,
		};
	}

	public async getAllByUserId(
		args: MethodParams<IReviewService, "getAllByUserId">,
	): MethodReturn<IReviewService, "getAllByUserId"> {
		const logger = this._getLogger({ method: "getAllByUserId" });
		logger.debug({ args }, "Getting all reviews by user ID");

		// validate arguments
		const argsValidationResult =
			reviewByUserIdPaginationParamsSchema.safeParse(args);
		if (!argsValidationResult.success) {
			logger.warn(argsValidationResult.error, "Invalid arguments data");
			return {
				error: new ValidationError("Invalid arguments data", {
					cause: argsValidationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedArgs: argsValidationResult.data },
			"Validated arguments data",
		);

		// repository call
		const result = await this._repository.getAllByUserId(
			argsValidationResult.data,
		);
		if (!result.success) {
			logger.error(
				{ error: result.error },
				"Failed to get all reviews by user ID",
			);
			return result;
		}

		logger.info(
			{ totalReviews: result.data.meta.totalItems },
			"Reviews retrieved by user ID successfully",
		);

		return {
			data: result.data,
			success: true,
		};
	}

	public async getById({
		reviewId,
	}: MethodParams<IReviewService, "getById">): MethodReturn<
		IReviewService,
		"getById"
	> {
		const logger = this._getLogger({ method: "getById" });
		logger.debug({ reviewId }, "Getting review by ID");

		const reviewIdValidationResult = this._validateObjectId(
			"reviewId",
			reviewId,
		);
		if (!reviewIdValidationResult.success) {
			logger.warn(
				{ error: reviewIdValidationResult.error, reviewId },
				"review ID validation failed",
			);
			return reviewIdValidationResult;
		}

		const result = await this._repository.getById({
			reviewId: reviewIdValidationResult.data,
		});
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to get review by ID");
			return result;
		}

		if (!result.data) {
			logger.warn({ reviewId }, "Review not found");
			return {
				error: new NotFoundError("Review"),
				success: false,
			};
		}

		logger.info({ reviewId }, "Review retrieved by ID successfully");

		return {
			data: result.data,
			success: true,
		};
	}

	public async update({
		data,
		reviewId,
	}: MethodParams<IReviewService, "update">): MethodReturn<
		IReviewService,
		"update"
	> {
		const logger = this._getLogger({ method: "update" });
		logger.debug({ data, reviewId }, "Updating review");

		const reviewIdValidationResult = this._validateObjectId(
			"reviewId",
			reviewId,
		);
		if (!reviewIdValidationResult.success) {
			logger.warn(
				{ error: reviewIdValidationResult.error, reviewId },
				"review ID validation failed",
			);
			return reviewIdValidationResult;
		}

		const updateDataValidationResult = this._validateUpdateData(data);
		if (!updateDataValidationResult.success) {
			logger.warn(
				{ error: updateDataValidationResult.error, reviewId },
				"update data validation failed",
			);
			return updateDataValidationResult;
		}

		const result = await this._repository.update({
			data: updateDataValidationResult.data,
			reviewId: reviewIdValidationResult.data,
		});
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to update review");
			return result;
		}

		if (!result.data) {
			logger.warn({ reviewId }, "Review not found");
			return {
				error: new NotFoundError("Review"),
				success: false,
			};
		}

		logger.info({ reviewId }, "Review updated successfully");
		return {
			data: result.data,
			success: true,
		};
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "review service", ...args });
	}

	private _validateCreateData(data: CreateReview): ReviewResult<CreateReview> {
		const result = createReviewSchema.safeParse(data);
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
		data: Partial<CreateReview>,
	): ReviewResult<Partial<CreateReview>> {
		const result = createReviewSchema.partial().safeParse(data);
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

export const reviewService = new ReviewService();
