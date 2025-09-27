import type { Types } from "mongoose";

import type { IReviewService } from "../services/index.js";
import type {
	AsyncHandler,
	InsertReview,
	SelectReview,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { insertReviewSchema } from "../schemas/index.js";
import { ReviewService } from "../services/index.js";
import { asyncHandler, removeEmptyFieldsSchema } from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IReviewController {
	count: AsyncHandler<{
		resBody: { data: number };
	}>;
	countByProductId: AsyncHandler<{
		params: { productId: string };
		resBody: { data: number };
	}>;
	countByUserId: AsyncHandler<{
		params: { userId: string };
		resBody: { data: number };
	}>;
	create: AsyncHandler<{
		reqBody: InsertReview;
		resBody: { data: SelectReview };
	}>;
	delete: AsyncHandler<{
		params: { reviewId: string };
		resBody: { data: null };
	}>;
	existsById: AsyncHandler<{
		params: { reviewId: string };
		resBody: { data: { _id: Types.ObjectId } };
	}>;
	existsByUserIdAndProductId: AsyncHandler<{
		params: { productId: string; userId: string };
		resBody: { data: { _id: Types.ObjectId } };
	}>;
	getAll: AsyncHandler<{
		resBody: { data: Array<SelectReview> };
	}>;
	getAllByProductId: AsyncHandler<{
		params: { productId: string };
		resBody: { data: Array<SelectReview> };
	}>;
	getAllByUserId: AsyncHandler<{
		params: { userId: string };
		resBody: { data: Array<SelectReview> };
	}>;
	getById: AsyncHandler<{
		params: { reviewId: string };
		resBody: { data: SelectReview };
	}>;
	update: AsyncHandler<{
		params: { reviewId: string };
		resBody: { data: SelectReview };
	}>;
}
export class ReviewController implements IReviewController {
	private readonly _service: IReviewService;

	count = asyncHandler<{
		resBody: { data: number };
	}>(async (req, res) => {
		const count = await this._service.count();

		res.status(HTTP_STATUS.OK).json({
			data: count,
			success: true,
		});
	});

	countByProductId = asyncHandler<{
		params: { productId: string };
		resBody: { data: number };
	}>(async (req, res) => {
		const productId = objectIdValidator.parse(req.params.productId);

		const count = await this._service.countByProductId({ productId });

		res.status(HTTP_STATUS.OK).json({
			data: count,
			success: true,
		});
	});

	countByUserId = asyncHandler<{
		params: { userId: string };
		resBody: { data: number };
	}>(async (req, res) => {
		const userId = objectIdValidator.parse(req.params.userId);

		const count = await this._service.countByUserId({ userId });

		res.status(HTTP_STATUS.OK).json({
			data: count,
			success: true,
		});
	});

	create = asyncHandler<{
		reqBody: InsertReview;
		resBody: { data: SelectReview };
	}>(async (req, res) => {
		const data = insertReviewSchema.parse({
			...req.body,
			name: res.locals.user.name,
			user: res.locals.user._id,
		});

		const newReview = await this._service.create(data);

		res.status(HTTP_STATUS.CREATED).json({
			data: newReview,
			success: true,
		});
	});

	delete = asyncHandler<{
		params: { reviewId: string };
		resBody: { data: null };
	}>(async (req, res) => {
		const reviewId = objectIdValidator.parse(req.params.reviewId);

		await this._service.delete({ reviewId });

		res.status(HTTP_STATUS.NO_CONTENT).json({
			data: null,
			success: true,
		});
	});

	existsById = asyncHandler<{
		params: { reviewId: string };
		resBody: { data: { _id: Types.ObjectId } };
	}>(async (req, res) => {
		const reviewId = objectIdValidator.parse(req.params.reviewId);

		const exists = await this._service.existsById({ reviewId });

		res.status(HTTP_STATUS.OK).json({
			data: exists,
			success: true,
		});
	});

	existsByUserIdAndProductId = asyncHandler<{
		params: { productId: string; userId: string };
		resBody: { data: { _id: Types.ObjectId } };
	}>(async (req, res) => {
		const userId = objectIdValidator.parse(req.params.userId);
		const productId = objectIdValidator.parse(req.params.productId);

		const exists = await this._service.existsByUserIdAndProductId({
			productId,
			userId,
		});

		res.status(HTTP_STATUS.OK).json({
			data: exists,
			success: true,
		});
	});

	getAll = asyncHandler<{
		resBody: { data: Array<SelectReview> };
	}>(async (req, res) => {
		const reviews = await this._service.getAll();

		res.status(HTTP_STATUS.OK).json({
			data: reviews,
			success: true,
		});
	});

	getAllByProductId = asyncHandler<{
		params: { productId: string };
		resBody: { data: Array<SelectReview> };
	}>(async (req, res) => {
		const productId = objectIdValidator.parse(req.params.productId);

		const reviews = await this._service.getAllByProductId({ productId });

		res.status(HTTP_STATUS.OK).json({
			data: reviews,
			success: true,
		});
	});

	getAllByUserId = asyncHandler<{
		params: { userId: string };
		resBody: { data: Array<SelectReview> };
	}>(async (req, res) => {
		const userId = objectIdValidator.parse(req.params.userId);

		const reviews = await this._service.getAllByUserId({ userId });

		res.status(HTTP_STATUS.OK).json({
			data: reviews,
			success: true,
		});
	});

	getById = asyncHandler<{
		params: { reviewId: string };
		resBody: { data: SelectReview };
	}>(async (req, res) => {
		const reviewId = objectIdValidator.parse(req.params.reviewId);

		const review = await this._service.getById({ reviewId });

		res.status(HTTP_STATUS.OK).json({
			data: review,
			success: true,
		});
	});

	update = asyncHandler<{
		params: { reviewId: string };
		resBody: { data: SelectReview };
	}>(async (req, res) => {
		const reviewId = objectIdValidator.parse(req.params.reviewId);
		const data = removeEmptyFieldsSchema(insertReviewSchema.partial()).parse(
			req.body,
		);

		const updatedReview = await this._service.update({
			data,
			reviewId,
		});

		res.status(HTTP_STATUS.OK).json({
			data: updatedReview,
			success: true,
		});
	});

	constructor(service: IReviewService = new ReviewService()) {
		this._service = service;
	}
}
