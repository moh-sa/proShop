import type { Types } from "mongoose";

import type { IReviewService } from "../services/index.js";
import type {
	AsyncHandler,
	InsertReview,
	PaginatedResponse,
	PaginationParamsString,
	SafeSelectUser,
	SelectReview,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { ReviewService } from "../services/index.js";
import { asyncHandler } from "../utils/index.js";

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
		locals: { user: SafeSelectUser };
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
		query: PaginationParamsString;
		resBody: {
			data: PaginatedResponse<SelectReview>["items"];
			meta: PaginatedResponse<SelectReview>["meta"];
		};
	}>;
	getAllByProductId: AsyncHandler<{
		params: { productId: string };
		query: PaginationParamsString;
		resBody: {
			data: PaginatedResponse<SelectReview>["items"];
			meta: PaginatedResponse<SelectReview>["meta"];
		};
	}>;
	getAllByUserId: AsyncHandler<{
		params: { userId: string };
		query: PaginationParamsString;
		resBody: {
			data: PaginatedResponse<SelectReview>["items"];
			meta: PaginatedResponse<SelectReview>["meta"];
		};
	}>;
	getById: AsyncHandler<{
		params: { reviewId: string };
		resBody: { data: SelectReview };
	}>;
	update: AsyncHandler<{
		params: { reviewId: string };
		reqBody: Partial<InsertReview>;
		resBody: { data: SelectReview };
	}>;
}
export class ReviewController implements IReviewController {
	private readonly _service: IReviewService;

	count = asyncHandler<{
		resBody: { data: number };
	}>(async (req, res) => {
		const count = await this._service.count();
		if (!count.success) {
			throw count.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: count.data,
			success: true,
		});
	});

	countByProductId = asyncHandler<{
		params: { productId: string };
		resBody: { data: number };
	}>(async (req, res) => {
		const count = await this._service.countByProductId({
			productId: req.params.productId,
		});
		if (!count.success) {
			throw count.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: count.data,
			success: true,
		});
	});

	countByUserId = asyncHandler<{
		params: { userId: string };
		resBody: { data: number };
	}>(async (req, res) => {
		const count = await this._service.countByUserId({
			userId: req.params.userId,
		});
		if (!count.success) {
			throw count.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: count.data,
			success: true,
		});
	});

	create = asyncHandler<{
		locals: { user: SafeSelectUser };
		reqBody: InsertReview;
		resBody: { data: SelectReview };
	}>(async (req, res) => {
		const data = {
			...req.body,
			name: res.locals.user.name,
			user: res.locals.user._id,
		};

		const newReview = await this._service.create(data);
		if (!newReview.success) {
			throw newReview.error;
		}

		res.status(HTTP_STATUS.CREATED).json({
			data: newReview.data,
			success: true,
		});
	});

	delete = asyncHandler<{
		params: { reviewId: string };
		resBody: { data: null };
	}>(async (req, res) => {
		const result = await this._service.delete({
			reviewId: req.params.reviewId,
		});
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.NO_CONTENT).json({
			data: null,
			success: true,
		});
	});

	existsById = asyncHandler<{
		params: { reviewId: string };
		resBody: { data: { _id: Types.ObjectId } };
	}>(async (req, res) => {
		const exists = await this._service.existsById({
			reviewId: req.params.reviewId,
		});
		if (!exists.success) {
			throw exists.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: exists.data,
			success: true,
		});
	});

	existsByUserIdAndProductId = asyncHandler<{
		params: { productId: string; userId: string };
		resBody: { data: { _id: Types.ObjectId } };
	}>(async (req, res) => {
		const exists = await this._service.existsByUserIdAndProductId({
			productId: req.params.productId,
			userId: req.params.userId,
		});
		if (!exists.success) {
			throw exists.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: exists.data,
			success: true,
		});
	});

	getAll = asyncHandler<{
		query: PaginationParamsString;
		resBody: {
			data: PaginatedResponse<SelectReview>["items"];
			meta: PaginatedResponse<SelectReview>["meta"];
		};
	}>(async (req, res) => {
		const reviews = await this._service.getAll({
			pageNumber: req.query.pageNumber,
			pageSize: req.query.pageSize,
			sort: req.query.sort,
		});
		if (!reviews.success) {
			throw reviews.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: reviews.data.items,
			meta: reviews.data.meta,
			success: true,
		});
	});

	getAllByProductId = asyncHandler<{
		params: { productId: string };
		query: PaginationParamsString;
		resBody: {
			data: PaginatedResponse<SelectReview>["items"];
			meta: PaginatedResponse<SelectReview>["meta"];
		};
	}>(async (req, res) => {
		const reviews = await this._service.getAllByProductId({
			pageNumber: req.query.pageNumber,
			pageSize: req.query.pageSize,
			productId: req.params.productId,
			sort: req.query.sort,
		});
		if (!reviews.success) {
			throw reviews.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: reviews.data.items,
			meta: reviews.data.meta,
			success: true,
		});
	});

	getAllByUserId = asyncHandler<{
		params: { userId: string };
		query: PaginationParamsString;
		resBody: {
			data: PaginatedResponse<SelectReview>["items"];
			meta: PaginatedResponse<SelectReview>["meta"];
		};
	}>(async (req, res) => {
		const reviews = await this._service.getAllByUserId({
			pageNumber: req.query.pageNumber,
			pageSize: req.query.pageSize,
			sort: req.query.sort,
			userId: req.params.userId,
		});
		if (!reviews.success) {
			throw reviews.error;
		}
		res.status(HTTP_STATUS.OK).json({
			data: reviews.data.items,
			meta: reviews.data.meta,
			success: true,
		});
	});

	getById = asyncHandler<{
		params: { reviewId: string };
		resBody: { data: SelectReview };
	}>(async (req, res) => {
		const review = await this._service.getById({
			reviewId: req.params.reviewId,
		});
		if (!review.success) {
			throw review.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: review.data,
			success: true,
		});
	});

	update = asyncHandler<{
		params: { reviewId: string };
		reqBody: Partial<InsertReview>;
		resBody: { data: SelectReview };
	}>(async (req, res) => {
		const updatedReview = await this._service.update({
			data: req.body,
			reviewId: req.params.reviewId,
		});
		if (!updatedReview.success) {
			throw updatedReview.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: updatedReview.data,
			success: true,
		});
	});

	constructor(service: IReviewService = new ReviewService()) {
		this._service = service;
	}
}
