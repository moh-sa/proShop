import { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../errors";
import { insertUserSchema } from "../schemas";
import { IUserService, UserService } from "../services";
import {
  asyncHandler,
  removeEmptyFieldsSchema,
  sendSuccessResponse,
} from "../utils";
import { objectIdValidator } from "../validators";

export interface IUserController {
  getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export class UserController implements IUserController {
  private readonly service: IUserService;

  constructor(service: IUserService = new UserService()) {
    this.service = service;
  }

  getById = asyncHandler(async (req, res) => {
    const idReq = req.params.userId || res.locals.user._id;
    const userId = objectIdValidator.parse(idReq);

    const response = await this.service.getById({ userId });

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: response,
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const response = await this.service.getAll();

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: response,
    });
  });

  update = asyncHandler(async (req, res) => {
    const idReq = req.params.userId || res.locals.user._id;
    const userId = objectIdValidator.parse(idReq);

    const data = removeEmptyFieldsSchema(insertUserSchema.partial()).parse(
      req.body,
    );

    const response = await this.service.updateById({
      userId,
      data,
    });

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: response,
    });
  });

  delete = asyncHandler(async (req, res) => {
    const idReq = req.params.userId;
    const userId = objectIdValidator.parse(idReq);

    const response = await this.service.delete({ userId });
    if (!response) throw new NotFoundError("User");

    return sendSuccessResponse({
      res,
      statusCode: 204,
      data: null,
    });
  });
}
