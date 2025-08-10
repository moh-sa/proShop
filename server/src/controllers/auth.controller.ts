import type { NextFunction, Request, Response } from "express";

import type { IAuthService } from "../services/index.js";

import { insertUserSchema, selectUserSchema } from "../schemas/index.js";
import { AuthService } from "../services/index.js";
import { asyncHandler, sendSuccessResponse } from "../utils/index.js";

export interface IAuthController {
  signin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  signup: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export class AuthController implements IAuthController {
  private readonly _service: IAuthService;

  signin = asyncHandler(async (req, res) => {
    const data = res.locals.user || req.body;

    const parsedData = selectUserSchema
      .pick({ email: true, password: true })
      .parse(data);

    const response = await this._service.signin(parsedData);

    return sendSuccessResponse({
      data: response,
      responseContext: res,
      statusCode: 200,
    });
  });

  signup = asyncHandler(async (req, res) => {
    const data = insertUserSchema.parse(req.body);

    const response = await this._service.signup(data);

    return sendSuccessResponse({
      data: response,
      responseContext: res,
      statusCode: 201,
    });
  });

  constructor(service: IAuthService = new AuthService()) {
    this._service = service;
  }
}
