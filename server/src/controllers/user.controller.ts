import type { IUserService } from "../services/index.js";
import type { AsyncHandler, SafeSelectUser } from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { NotFoundError } from "../errors/index.js";
import { insertUserSchema } from "../schemas/index.js";
import { UserService } from "../services/index.js";
import { removeEmptyFieldsSchema, strictAsyncHandler } from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IUserController {
	delete: AsyncHandler<{
		params: { userId: string };
		resBody: { data: null };
	}>;
	getAll: AsyncHandler<{
		resBody: { data: Array<SafeSelectUser> };
	}>;
	getById: AsyncHandler<{
		params: { userId: string };
		resBody: { data: SafeSelectUser };
	}>;
	update: AsyncHandler<{
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

		res.status(HTTP_STATUS.NO_CONTENT).json({
			data: null,
			success: true,
		});
	});

	getAll = strictAsyncHandler<{
		resBody: { data: Array<SafeSelectUser> };
	}>(async (req, res) => {
		const response = await this._service.getAll();

		res.status(HTTP_STATUS.OK).json({
			data: response,
			success: true,
		});
	});

	getById = strictAsyncHandler<{
		params: { userId: string };
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const idReq = req.params?.userId ?? res.locals.user?._id;
		const userId = objectIdValidator.parse(idReq);

		const response = await this._service.getById({ userId });

		res.status(HTTP_STATUS.OK).json({
			data: response,
			success: true,
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

		res.status(HTTP_STATUS.OK).json({
			data: response,
			success: true,
		});
	});

	constructor(service: IUserService = new UserService()) {
		this._service = service;
	}
}
