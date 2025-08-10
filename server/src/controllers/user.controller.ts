import type { NextFunction, Request, Response } from "express";

import type { IUserService } from "../services/index.js";

import { NotFoundError } from "../errors/index.js";
import { insertUserSchema } from "../schemas/index.js";
import { UserService } from "../services/index.js";
import {
  asyncHandler,
  removeEmptyFieldsSchema,
  sendSuccessResponse,
} from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IUserController {
  delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export class UserController implements IUserController {
  private readonly _service: IUserService;

  delete = asyncHandler(async (req, res) => {
    const idReq = req.params.userId;
    const userId = objectIdValidator.parse(idReq);

    const response = await this._service.delete({ userId });
    if (!response) throw new NotFoundError("User");

    return sendSuccessResponse({
      data: null,
      responseContext: res,
      statusCode: 204,
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const response = await this._service.getAll();

    return sendSuccessResponse({
      data: response,
      responseContext: res,
      statusCode: 200,
    });
  });

  getById = asyncHandler(async (req, res) => {
    const idReq = req.params?.userId ?? res.locals.user?._id;
    const userId = objectIdValidator.parse(idReq);

    const response = await this._service.getById({ userId });

    return sendSuccessResponse({
      data: response,
      responseContext: res,
      statusCode: 200,
    });
  });

  update = asyncHandler(async (req, res) => {
    const idReq = req.params?.userId ?? res.locals.user?._id;
    const userId = objectIdValidator.parse(idReq);

    const data = removeEmptyFieldsSchema(insertUserSchema.partial()).parse(
      req.body,
    );

    const response = await this._service.updateById({
      data,
      userId,
    });

    return sendSuccessResponse({
      data: response,
      responseContext: res,
      statusCode: 200,
    });
  });

  constructor(service: IUserService = new UserService()) {
    this._service = service;
  }
}
