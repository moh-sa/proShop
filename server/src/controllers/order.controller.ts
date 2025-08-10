import type { NextFunction, Request, Response } from "express";

import type { IOrderService } from "../services/index.js";

import { insertOrderSchema } from "../schemas/index.js";
import { OrderService } from "../services/index.js";
import { asyncHandler, sendSuccessResponse } from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IOrderController {
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAllByUserId: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateToDelivered: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  updateToPaid: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
}
export class OrderController implements IOrderController {
  private readonly _service: IOrderService;

  create = asyncHandler(async (req, res) => {
    const data = insertOrderSchema.parse({
      ...req.body,
      user: res.locals.user._id,
    });

    const response = await this._service.create(data);

    return sendSuccessResponse({
      data: response,
      responseContext: res,
      statusCode: 201,
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const orders = await this._service.getAll();

    return sendSuccessResponse({
      data: orders,
      responseContext: res,
      statusCode: 200,
    });
  });

  getAllByUserId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);

    const orders = await this._service.getAllByUserId({ userId });

    return sendSuccessResponse({
      data: orders,
      responseContext: res,
      statusCode: 200,
    });
  });

  getById = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.orderId);

    const order = await this._service.getById({ orderId });

    return sendSuccessResponse({
      data: order,
      responseContext: res,
      statusCode: 200,
    });
  });

  updateToDelivered = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.orderId);

    const order = await this._service.updateToDelivered({ orderId });

    return sendSuccessResponse({
      data: order,
      responseContext: res,
      statusCode: 200,
    });
  });

  updateToPaid = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.orderId);

    const order = await this._service.updateToPaid({ orderId });

    return sendSuccessResponse({
      data: order,
      responseContext: res,
      statusCode: 200,
    });
  });

  constructor(service: IOrderService = new OrderService()) {
    this._service = service;
  }
}
