import type { NextFunction, Request, Response } from "express";

import type { IUserService } from "../services/index.js";
import type { SelectUser } from "../types/user.type.js";

import { InternalError, NotFoundError } from "../errors/index.js";
import { insertUserSchema, selectUserSchema } from "../schemas/index.js";
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
		if (!response) {
			throw new NotFoundError("User");
		}

		return sendSuccessResponse({
			data: null,
			responseContext: res,
			statusCode: 204,
		});
	});

	getAll = asyncHandler(async (req, res) => {
		const response = await this._service.getAll();
		const sanitizedResponse = response.map((user) =>
			this._sanitizeResponse(user),
		);

		return sendSuccessResponse({
			data: sanitizedResponse,
			responseContext: res,
			statusCode: 200,
		});
	});

	getById = asyncHandler(async (req, res) => {
		const idReq = req.params?.userId ?? res.locals.user?._id;
		const userId = objectIdValidator.parse(idReq);

		const response = await this._service.getById({ userId });
		const sanitizedResponse = this._sanitizeResponse(response);

		return sendSuccessResponse({
			data: sanitizedResponse,
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
		const sanitizedResponse = this._sanitizeResponse(response);

		return sendSuccessResponse({
			data: sanitizedResponse,
			responseContext: res,
			statusCode: 200,
		});
	});

	constructor(service: IUserService = new UserService()) {
		this._service = service;
	}

	private _sanitizeResponse(user: SelectUser) {
		const result = selectUserSchema.omit({ password: true }).safeParse(user);
		if (!result.success) {
			throw new InternalError("Invalid user data", { cause: result.error });
		}

		return result.data;
	}
}
