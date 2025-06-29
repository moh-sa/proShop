import { NextFunction, Request, Response } from "express";
import { insertUserSchema, selectUserSchema } from "../schemas";
import { AuthService, IAuthService } from "../services";
import { asyncHandler, sendSuccessResponse } from "../utils";

export interface IAuthController {
  signin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  signup: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export class AuthController implements IAuthController {
  private readonly _service: IAuthService;

  constructor(service: IAuthService = new AuthService()) {
    this._service = service;
  }

  signin = asyncHandler(async (req, res) => {
    const data = res.locals.user || req.body;

    const parsedData = selectUserSchema
      .pick({ email: true, password: true })
      .parse(data);

    const response = await this._service.signin(parsedData);

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: response,
    });
  });

  signup = asyncHandler(async (req, res) => {
    const data = insertUserSchema.parse(req.body);

    const response = await this._service.signup(data);

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 201,
      data: response,
    });
  });
}
