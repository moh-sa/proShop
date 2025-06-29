import { NextFunction, Request, Response } from "express";
import { insertReviewSchema } from "../schemas";
import { IReviewService, ReviewService } from "../services";
import {
  asyncHandler,
  removeEmptyFieldsSchema,
  sendSuccessResponse,
} from "../utils";
import { objectIdValidator } from "../validators";

export interface IReviewController {
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAllByUserId: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  getAllByProductId: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  count: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  countByUserId: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  countByProductId: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
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
}
export class ReviewController implements IReviewController {
  private readonly service: IReviewService;

  constructor(service: IReviewService = new ReviewService()) {
    this.service = service;
  }

  create = asyncHandler(async (req, res) => {
    const data = insertReviewSchema.parse({
      ...req.body,
      user: res.locals.user._id,
      name: res.locals.user.name,
    });

    const newReview = await this.service.create(data);

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 201,
      data: newReview,
    });
  });

  getById = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);

    const review = await this.service.getById({ reviewId });

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: review,
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const reviews = await this.service.getAll();

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: reviews,
    });
  });

  getAllByUserId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);

    const reviews = await this.service.getAllByUserId({ userId });

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: reviews,
    });
  });

  getAllByProductId = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    const reviews = await this.service.getAllByProductId({ productId });

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: reviews,
    });
  });

  update = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);
    const data = removeEmptyFieldsSchema(insertReviewSchema.partial()).parse(
      req.body,
    );

    const updatedReview = await this.service.update({
      reviewId,
      data,
    });

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: updatedReview,
    });
  });

  delete = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);

    await this.service.delete({ reviewId });

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 204,
      data: null,
    });
  });

  count = asyncHandler(async (req, res) => {
    const count = await this.service.count();

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: count,
    });
  });

  countByUserId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);

    const count = await this.service.countByUserId({ userId });

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: count,
    });
  });

  countByProductId = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    const count = await this.service.countByProductId({ productId });

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: count,
    });
  });

  existsById = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);

    const exists = await this.service.existsById({ reviewId });

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: exists,
    });
  });

  existsByUserIdAndProductId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);
    const productId = objectIdValidator.parse(req.params.productId);

    const exists = await this.service.existsByUserIdAndProductId({
      userId,
      productId,
    });

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: exists,
    });
  });
}
