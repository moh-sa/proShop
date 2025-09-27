import type { IUserService } from "../services/index.js";
import type { SafeSelectUser, StrictAsyncHandler } from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { NotFoundError } from "../errors/index.js";
import { insertUserSchema } from "../schemas/index.js";
import { UserService } from "../services/index.js";
import {
	removeEmptyFieldsSchema,
	sendSuccessResponse,
	strictAsyncHandler,
} from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IUserController {
	delete: StrictAsyncHandler<{
		params: { userId: string };
		resBody: { data: null };
	}>;
	getAll: StrictAsyncHandler<{
		resBody: { data: Array<SafeSelectUser> };
	}>;
	getById: StrictAsyncHandler<{
		params: { userId: string };
		resBody: { data: SafeSelectUser };
	}>;
	update: StrictAsyncHandler<{
		params: { userId: string };
		resBody: { data: SafeSelectUser };
	}>;
}

export class UserController implements IUserController {
	private readonly _service: IUserService;

	delete = strictAsyncHandler<{
		params: { userId: string };
		resBody: { data: null };
	}>(async (req, res) => {
		const idReq = req.params.userId;
		const userId = objectIdValidator.parse(idReq);

		const response = await this._service.delete({ userId });
		if (!response) {
			throw new NotFoundError("User");
		}

		return sendSuccessResponse({
			data: null,
			responseContext: res,
			statusCode: HTTP_STATUS.NO_CONTENT,
		});
	});

	getAll = strictAsyncHandler<{
		resBody: { data: Array<SafeSelectUser> };
	}>(async (req, res) => {
		const response = await this._service.getAll();

		return sendSuccessResponse({
			data: response,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	getById = strictAsyncHandler<{
		params: { userId: string };
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const idReq = req.params?.userId ?? res.locals.user?._id;
		const userId = objectIdValidator.parse(idReq);

		const response = await this._service.getById({ userId });

		return sendSuccessResponse({
			data: response,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	update = strictAsyncHandler<{
		params: { userId: string };
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
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
			statusCode: HTTP_STATUS.OK,
		});
	});

	constructor(service: IUserService = new UserService()) {
		this._service = service;
	}
}
