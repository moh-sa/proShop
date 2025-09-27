import type { Types } from "mongoose";

import type { IReviewService } from "../services/index.js";
import type {
	InsertReview,
	SelectReview,
	StrictAsyncHandler,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { insertReviewSchema } from "../schemas/index.js";
import { ReviewService } from "../services/index.js";
import { removeEmptyFieldsSchema, strictAsyncHandler } from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IReviewController {
	count: StrictAsyncHandler<{
		resBody: { data: number };
	}>;
	countByProductId: StrictAsyncHandler<{
		params: { productId: string };
		resBody: { data: number };
	}>;
	countByUserId: StrictAsyncHandler<{
		params: { userId: string };
		resBody: { data: number };
	}>;
	create: StrictAsyncHandler<{
		reqBody: InsertReview;
		resBody: { data: SelectReview };
	}>;
	delete: StrictAsyncHandler<{
		params: { reviewId: string };
		resBody: { data: null };
	}>;
	existsById: StrictAsyncHandler<{
		params: { reviewId: string };
		resBody: { data: { _id: Types.ObjectId } };
	}>;
	existsByUserIdAndProductId: StrictAsyncHandler<{
		params: { productId: string; userId: string };
		resBody: { data: { _id: Types.ObjectId } };
	}>;
	getAll: StrictAsyncHandler<{
		resBody: { data: Array<SelectReview> };
	}>;
	getAllByProductId: StrictAsyncHandler<{
		params: { productId: string };
		resBody: { data: Array<SelectReview> };
	}>;
	getAllByUserId: StrictAsyncHandler<{
		params: { userId: string };
		resBody: { data: Array<SelectReview> };
	}>;
	getById: StrictAsyncHandler<{
		params: { reviewId: string };
		resBody: { data: SelectReview };
	}>;
	update: StrictAsyncHandler<{
		params: { reviewId: string };
		resBody: { data: SelectReview };
	}>;
}
export class ReviewController implements IReviewController {
	private readonly _service: IReviewService;

	count = strictAsyncHandler<{
		resBody: { data: number };
	}>(async (req, res) => {
		const count = await this._service.count();

		res.status(HTTP_STATUS.OK).json({
			data: count,
			success: true,
		});
	});

	countByProductId = strictAsyncHandler<{
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

	countByUserId = strictAsyncHandler<{
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

	create = strictAsyncHandler<{
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

	delete = strictAsyncHandler<{
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

	existsById = strictAsyncHandler<{
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

	existsByUserIdAndProductId = strictAsyncHandler<{
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

	getAll = strictAsyncHandler<{
		resBody: { data: Array<SelectReview> };
	}>(async (req, res) => {
		const reviews = await this._service.getAll();

		res.status(HTTP_STATUS.OK).json({
			data: reviews,
			success: true,
		});
	});

	getAllByProductId = strictAsyncHandler<{
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

	getAllByUserId = strictAsyncHandler<{
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

	getById = strictAsyncHandler<{
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

	update = strictAsyncHandler<{
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
