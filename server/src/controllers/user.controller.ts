import type { IUserService } from "../services/index.js";
import type {
	AsyncHandler,
	InsertUser,
	SafeSelectUser,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { NotFoundError } from "../errors/index.js";
import { UserService } from "../services/index.js";
import { asyncHandler } from "../utils/index.js";

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
		reqBody: Partial<InsertUser>;
		resBody: { data: SafeSelectUser };
	}>;
}

export class UserController implements IUserController {
	private readonly _service: IUserService;

	delete = asyncHandler<{
		params: { userId: string };
		resBody: { data: null };
	}>(async (req, res) => {
		const response = await this._service.delete({ userId: req.params.userId });
		if (!response) {
			throw new NotFoundError("User");
		}

		res.status(HTTP_STATUS.NO_CONTENT).json({
			data: null,
			success: true,
		});
	});

	getAll = asyncHandler<{
		resBody: { data: Array<SafeSelectUser> };
	}>(async (req, res) => {
		const response = await this._service.getAll();

		res.status(HTTP_STATUS.OK).json({
			data: response,
			success: true,
		});
	});

	getById = asyncHandler<{
		params: { userId: string };
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const response = await this._service.getById({
			userId: req.params?.userId ?? res.locals.user?._id,
		});

		res.status(HTTP_STATUS.OK).json({
			data: response,
			success: true,
		});
	});

	update = asyncHandler<{
		params: { userId: string };
		reqBody: Partial<InsertUser>;
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const response = await this._service.updateById({
			data: req.body,
			userId: req.params?.userId ?? res.locals.user?._id,
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
