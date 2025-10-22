import type { IUserService } from "../services/index.js";
import type {
	AsyncHandler,
	InsertUser,
	PaginatedResponse,
	SafeSelectUser,
	UserPaginationParams,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { UserService } from "../services/index.js";
import { asyncHandler } from "../utils/index.js";

export interface IUserController {
	delete: AsyncHandler<{
		params: { userId: string };
		resBody: { data: null };
	}>;
	getAll: AsyncHandler<{
		query: UserPaginationParams;
		resBody: {
			data: PaginatedResponse<SafeSelectUser>["items"];
			meta: PaginatedResponse<SafeSelectUser>["meta"];
		};
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
		const result = await this._service.delete({ userId: req.params.userId });
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.NO_CONTENT).json({
			data: null,
			success: true,
		});
	});

	getAll = asyncHandler<{
		query: UserPaginationParams;
		resBody: {
			data: PaginatedResponse<SafeSelectUser>["items"];
			meta: PaginatedResponse<SafeSelectUser>["meta"];
		};
	}>(async (req, res) => {
		const result = await this._service.getAll(req.query);
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: result.data.items,
			meta: result.data.meta,
			success: true,
		});
	});

	getById = asyncHandler<{
		params: { userId: string };
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const result = await this._service.getById({
			userId: req.params?.userId ?? res.locals.user?._id,
		});
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	update = asyncHandler<{
		params: { userId: string };
		reqBody: Partial<InsertUser>;
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const result = await this._service.updateById({
			data: req.body,
			userId: req.params?.userId ?? res.locals.user?._id,
		});
		if (!result.success) {
			throw result.error;
		}

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	constructor(service: IUserService = new UserService()) {
		this._service = service;
	}
}
