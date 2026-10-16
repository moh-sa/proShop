import { HTTP_STATUS } from "../constants/index.js";
import type { IUserManager } from "../managers/index.js";
import { userManager } from "../managers/index.js";
import type { IUserService } from "../services/index.js";
import { userService } from "../services/index.js";
import type {
	AdminUpdateUserBodyInput,
	AsyncHandler,
	GetAllUsersControllerParams,
	GetAllUsersServiceParams,
	PaginatedResponse,
	SafeSelectUser,
	UpdateProfileBodyInput,
} from "../types/index.js";
import { asyncHandler, getLoggerFromContext } from "../utils/index.js";

export interface IUserController {
	delete: AsyncHandler<{
		params: { userId: string };
		resBody: never;
	}>;
	getAll: AsyncHandler<{
		query: GetAllUsersControllerParams;
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
		params: { userId: string };
		reqBody: AdminUpdateUserBodyInput;
		resBody: { data: SafeSelectUser };
	}>;
	updateProfile: AsyncHandler<{
		locals: { user: SafeSelectUser };
		reqBody: UpdateProfileBodyInput;
		resBody: { data: SafeSelectUser };
	}>;
}

export class UserController implements IUserController {
	private readonly _manager: IUserManager;
	private readonly _service: IUserService;

	delete = asyncHandler<{
		params: { userId: string };
		resBody: never;
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "delete" });
		logger.debug({ userId: req.params.userId }, "Deleting user");

		const result = await this._service.delete({ userId: req.params.userId });
		if (!result.success) {
			throw result.error;
		}

		logger.info({ userId: result.data.id }, "User deleted successfully");

		res.status(HTTP_STATUS.NO_CONTENT).end();
	});

	getAll = asyncHandler<{
		query: GetAllUsersControllerParams;
		resBody: {
			data: PaginatedResponse<SafeSelectUser>["items"];
			meta: PaginatedResponse<SafeSelectUser>["meta"];
		};
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getAll" });
		logger.debug({ query: req.query }, "Getting all users");

		const options: GetAllUsersServiceParams = {
			filters: {
				email: req.query.email,
				isAdmin: req.query.isAdmin,
				name: req.query.name,
			},
			pageNumber: req.query.pageNumber,
			pageSize: req.query.pageSize,
			sort: req.query.sort,
		};

		const result = await this._service.getAll(options);
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
			userId: req.params.userId || res.locals.user.id,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ userId: result.data.id },
			"User retrieved by ID successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	/**
	 * PATCH /users/:userId (admin)
	 */
	update = asyncHandler<{
		params: { userId: string };
		reqBody: AdminUpdateUserBodyInput;
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "update" });
		logger.debug(
			{ data: { ...req.body }, userId: req.params.userId },
			"Updating user",
		);

		const result = await this._service.updateById({
			...req.body,
			userId: req.params.userId,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ fields: Object.keys(req.body), userId: result.data.id },
			"User updated successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	/**
	 * PATCH /users/profile
	 */
	updateProfile = asyncHandler<{
		locals: { user: SafeSelectUser };
		reqBody: UpdateProfileBodyInput;
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "updateProfile" });
		logger.debug(
			{ data: { ...req.body }, userId: res.locals.user.id },
			"Updating profile",
		);

		const result = await this._manager.updateProfile({
			...req.body,
			userId: res.locals.user.id,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{
				fields: Object.keys(req.body).filter(
					(field) => field !== "currentPassword",
				),
				userId: result.data.id,
			},
			"Profile updated successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
			success: true,
		});
	});

	constructor(service?: IUserService, manager?: IUserManager) {
		this._service = service ?? userService;
		this._manager = manager ?? userManager;
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "user controller", ...args });
	}
}

export const userController = new UserController();
