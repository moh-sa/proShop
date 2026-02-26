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
import { asyncHandler, getLoggerFromContext } from "../utils/index.js";

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
		locals: { user: SafeSelectUser };
		params: { userId: string };
		resBody: { data: SafeSelectUser };
	}>;
	update: AsyncHandler<{
		locals: { user: SafeSelectUser };
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
		const logger = this._getLogger({ method: "delete" });
		logger.debug({ userId: req.params.userId }, "Deleting user");

		const result = await this._service.delete({ userId: req.params.userId });
		if (!result.success) {
			throw result.error;
		}

		logger.info({ userId: result.data._id }, "User deleted successfully");

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
		const logger = this._getLogger({ method: "getAll" });
		logger.debug({ query: req.query }, "Getting all users");

		const result = await this._service.getAll(req.query);
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ totalUsers: result.data.meta.totalItems },
			"Users retrieved successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data.items,
			meta: result.data.meta,
			success: true,
		});
	});

	getById = asyncHandler<{
		locals: { user: SafeSelectUser };
		params: { userId: string };
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getById" });
		logger.debug({ userId: req.params.userId }, "Getting user by ID");

		const result = await this._service.getById({
			userId: req.params.userId || res.locals.user._id.toString(),
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ userId: result.data._id },
			"User retrieved by ID successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	update = asyncHandler<{
		locals: { user: SafeSelectUser };
		params: { userId: string };
		reqBody: Partial<InsertUser>;
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "update" });
		logger.debug({ userId: req.params.userId }, "Updating user");

		const result = await this._service.updateById({
			data: req.body,
			userId: req.params.userId || res.locals.user._id.toString(),
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ updateData: req.body, userId: result.data._id },
			"User updated successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	constructor(service?: IUserService) {
		this._service = service ?? new UserService();
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "user controller", ...args });
	}
}
