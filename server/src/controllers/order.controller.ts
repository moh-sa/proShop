import { NextFunction } from "@sentry/node/build/types/integrations/tracing/nest/types";
import { Request, Response } from "express";
import { insertOrderSchema } from "../schemas";
import { IOrderService, OrderService } from "../services";
import { asyncHandler, sendSuccessResponse } from "../utils";
import { objectIdValidator } from "../validators";

export interface IOrderController {
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAllByUserId: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  updateToPaid: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  updateToDelivered: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
}
export class OrderController implements IOrderController {
  private readonly service: IOrderService;

  constructor(service: IOrderService = new OrderService()) {
    this.service = service;
  }

  create = asyncHandler(async (req, res) => {
    const data = insertOrderSchema.parse({
      ...req.body,
      user: res.locals.user._id,
    });

    const response = await this.service.create(data);

    return sendSuccessResponse({
      res,
      statusCode: 201,
      data: response,
    });
  });

  getById = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.orderId);

    const order = await this.service.getById({ orderId });

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: order,
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const orders = await this.service.getAll();

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: orders,
    });
  });

  getAllByUserId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);

    const orders = await this.service.getAllByUserId({ userId });

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: orders,
    });
  });

  updateToPaid = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.orderId);

    const order = await this.service.updateToPaid({ orderId });

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: order,
    });
  });

  updateToDelivered = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.orderId);

    const order = await this.service.updateToDelivered({ orderId });

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: order,
    });
  });
}
