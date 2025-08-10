import type { NextFunction, Request, Response } from "express";

import type { IReviewService } from "../services/index.js";

import { insertReviewSchema } from "../schemas/index.js";
import { ReviewService } from "../services/index.js";
import {
  asyncHandler,
  removeEmptyFieldsSchema,
  sendSuccessResponse,
} from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IReviewController {
  count: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  countByProductId: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  countByUserId: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  existsById: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  existsByUserIdAndProductId: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  getAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAllByProductId: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  getAllByUserId: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export class ReviewController implements IReviewController {
  private readonly _service: IReviewService;

  count = asyncHandler(async (req, res) => {
    const count = await this._service.count();

    return sendSuccessResponse({
      data: count,
      responseContext: res,
      statusCode: 200,
    });
  });

  countByProductId = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    const count = await this._service.countByProductId({ productId });

    return sendSuccessResponse({
      data: count,
      responseContext: res,
      statusCode: 200,
    });
  });

  countByUserId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);

    const count = await this._service.countByUserId({ userId });

    return sendSuccessResponse({
      data: count,
      responseContext: res,
      statusCode: 200,
    });
  });

  create = asyncHandler(async (req, res) => {
    const data = insertReviewSchema.parse({
      ...req.body,
      name: res.locals.user.name,
      user: res.locals.user._id,
    });

    const newReview = await this._service.create(data);

    return sendSuccessResponse({
      data: newReview,
      responseContext: res,
      statusCode: 201,
    });
  });

  delete = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);

    await this._service.delete({ reviewId });

    return sendSuccessResponse({
      data: null,
      responseContext: res,
      statusCode: 204,
    });
  });

  existsById = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);

    const exists = await this._service.existsById({ reviewId });

    return sendSuccessResponse({
      data: exists,
      responseContext: res,
      statusCode: 200,
    });
  });

  existsByUserIdAndProductId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);
    const productId = objectIdValidator.parse(req.params.productId);

    const exists = await this._service.existsByUserIdAndProductId({
      productId,
      userId,
    });

    return sendSuccessResponse({
      data: exists,
      responseContext: res,
      statusCode: 200,
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const reviews = await this._service.getAll();

    return sendSuccessResponse({
      data: reviews,
      responseContext: res,
      statusCode: 200,
    });
  });

  getAllByProductId = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    const reviews = await this._service.getAllByProductId({ productId });

    return sendSuccessResponse({
      data: reviews,
      responseContext: res,
      statusCode: 200,
    });
  });

  getAllByUserId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);

    const reviews = await this._service.getAllByUserId({ userId });

    return sendSuccessResponse({
      data: reviews,
      responseContext: res,
      statusCode: 200,
    });
  });

  getById = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);

    const review = await this._service.getById({ reviewId });

    return sendSuccessResponse({
      data: review,
      responseContext: res,
      statusCode: 200,
    });
  });

  update = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);
    const data = removeEmptyFieldsSchema(insertReviewSchema.partial()).parse(
      req.body,
    );

    const updatedReview = await this._service.update({
      data,
      reviewId,
    });

    return sendSuccessResponse({
      data: updatedReview,
      responseContext: res,
      statusCode: 200,
    });
  });

  constructor(service: IReviewService = new ReviewService()) {
    this._service = service;
  }
}
