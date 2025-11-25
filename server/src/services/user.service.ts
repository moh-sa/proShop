import type { FilterQuery, LeanDocument, Types } from "mongoose";

import type { IUserRepository } from "../repositories/index.js";
import type {
	InsertUser,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	Result,
	SafeSelectUser,
	SelectUser,
	UnSafeSelectUser,
	UserPaginationParams,
} from "../types/index.js";

import {
	InternalError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { UserRepository } from "../repositories/index.js";
import {
	insertUserSchema,
	selectUserSchema,
	userQuerySchema,
} from "../schemas/index.js";
import { getLoggerFromContext } from "../utils/index.js";
import {
	emailValidator,
	objectIdValidator,
	paginationParamsValidator,
} from "../validators/index.js";

export interface IUserService {
	create: (data: InsertUser) => Promise<UserResult<SafeSelectUser>>;
	delete: (data: { userId: string }) => Promise<UserResult<SafeSelectUser>>;
	existsByEmail: (data: {
		email: string;
	}) => Promise<UserResult<null | { _id: Types.ObjectId }>>;
	getAll: (
		args: UserPaginationParams,
	) => Promise<UserResult<PaginatedResponse<SafeSelectUser>>>;
	getByEmail: (data: { email: string }) => Promise<UserResult<SafeSelectUser>>;
	getById: (data: { userId: string }) => Promise<UserResult<SafeSelectUser>>;
	sanitizeUser: (user: SelectUser) => UserResult<SafeSelectUser>;
	updateById: (data: {
		data: Partial<InsertUser>;
		userId: string;
	}) => Promise<UserResult<SafeSelectUser>>;

	// UNSAFE METHODS - returns full user object
	/****ONLY FOR INTERNAL USE***/
	create_UNSAFE: (data: InsertUser) => Promise<UserResult<UnSafeSelectUser>>;
	/****ONLY FOR INTERNAL USE***/
	getByEmail_UNSAFE: (data: {
		email: string;
	}) => Promise<UserResult<UnSafeSelectUser>>;
	/****ONLY FOR INTERNAL USE***/
	getById_UNSAFE: (data: {
		userId: string;
	}) => Promise<UserResult<UnSafeSelectUser>>;
}

type UserResult<T> = Result<T>;

export class UserService implements IUserService {
	private readonly _repository: IUserRepository;

	constructor(repository: IUserRepository = new UserRepository()) {
		this._repository = repository;
	}

	async create(
		data: MethodParams<IUserService, "create">,
	): MethodReturn<IUserService, "create"> {
		const logger = this._getLogger({ method: "create" });
		logger.debug({ data }, "Creating user");

		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			logger.warn({ error: validationResult.error }, "Invalid user data");
			return validationResult;
		}

		logger.debug(
			{ validatedData: validationResult.data },
			"Validated user data",
		);

		const createdResult = await this._repository.create(validationResult.data);
		if (!createdResult.success) {
			logger.warn(
				{ error: createdResult.error },
				"Failed to create user in database",
			);
			return createdResult;
		}

		const sanitizeResult = this.sanitizeUser(createdResult.data);
		if (!sanitizeResult.success) {
			logger.warn(
				{ error: sanitizeResult.error, userId: createdResult.data._id },
				"Failed to sanitize user",
			);
			return sanitizeResult;
		}

		logger.info(
			{ userId: sanitizeResult.data._id },
			"User created successfully",
		);
		return {
			data: sanitizeResult.data,
			success: true,
		};
	}

	async delete({
		userId,
	}: MethodParams<IUserService, "delete">): MethodReturn<
		IUserService,
		"delete"
	> {
		const logger = this._getLogger({ method: "delete" });
		logger.debug({ userId }, "Deleting user");

		const validationResult = this._validateUserId(userId);
		if (!validationResult.success) {
			logger.warn({ error: validationResult.error, userId }, "Invalid user ID");
			return validationResult;
		}

		logger.debug(
			{ validatedUserId: validationResult.data },
			"Validated user ID",
		);

		const deleteResult = await this._repository.delete({
			userId: validationResult.data,
		});
		if (!deleteResult.success) {
			logger.warn(
				{ error: deleteResult.error, userId },
				"Failed to delete user",
			);
			return deleteResult;
		}
		if (!deleteResult.data) {
			logger.warn({ userId }, "User not found");
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		logger.debug({ deletedUser: deleteResult.data }, "User deleted");

		const sanitizeResult = this.sanitizeUser(deleteResult.data);
		if (!sanitizeResult.success) {
			logger.warn(
				{ error: sanitizeResult.error, userId },
				"Failed to sanitize user",
			);
			return sanitizeResult;
		}

		logger.info({ userId }, "User deleted successfully");
		return {
			data: sanitizeResult.data,
			success: true,
		};
	}

	public async existsByEmail({
		email,
	}: MethodParams<IUserService, "existsByEmail">): MethodReturn<
		IUserService,
		"existsByEmail"
	> {
		const logger = this._getLogger({ method: "existsByEmail" });
		logger.debug({ email }, "Checking if user exists by email");

		const validationResult = this._validateEmail(email);
		if (!validationResult.success) {
			logger.warn({ error: validationResult.error }, "Invalid email");
			return validationResult;
		}

		logger.debug({ validatedEmail: validationResult.data }, "Validated email");

		const existsResult = await this._repository.existsByEmail({
			email: validationResult.data,
		});
		if (!existsResult.success) {
			logger.warn(
				{ error: existsResult.error },
				"Failed to check if user exists by email",
			);
			return existsResult;
		}

		if (!existsResult.data) {
			logger.warn({ email }, "User not found");
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		logger.info(
			{ userId: existsResult.data._id },
			"User exists by email successfully",
		);

		return {
			data: existsResult.data,
			success: true,
		};
	}

	async getAll(
		args: MethodParams<IUserService, "getAll">,
	): MethodReturn<IUserService, "getAll"> {
		const logger = this._getLogger({ method: "getAll" });
		logger.debug({ args }, "Getting all users");

		const paginationResult = paginationParamsValidator
			.omit({ query: true })
			.safeParse({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				sort: args.sort,
			});
		if (!paginationResult.success) {
			logger.warn({ error: paginationResult.error }, "Invalid pagination data");

			return {
				error: new ValidationError("Invalid pagination data", {
					cause: paginationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedPaginationData: paginationResult.data },
			"Validated pagination data",
		);

		const queryResult = userQuerySchema.safeParse(args);
		if (!queryResult.success) {
			logger.warn({ error: queryResult.error }, "Invalid query data");
			return {
				error: new ValidationError("Invalid query data", {
					cause: queryResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedQueryData: queryResult.data },
			"Validated query data",
		);

		function searchQuery(): FilterQuery<LeanDocument<SelectUser>> {
			const result: FilterQuery<LeanDocument<SelectUser>> = {};

			if (queryResult.data?.email) {
				result.email = queryResult.data.email;
			}

			if (queryResult.data?.name) {
				result.name = { $options: "i", $regex: queryResult.data.name };
			}

			if (queryResult.data?.isAdmin !== undefined) {
				result.isAdmin = queryResult.data.isAdmin;
			}

			return result;
		}

		const getAllResult = await this._repository.getAll({
			pageNumber: paginationResult.data.pageNumber,
			pageSize: paginationResult.data.pageSize,
			query: searchQuery(),
			sort: paginationResult.data.sort,
		});
		if (!getAllResult.success) {
			logger.warn({ error: getAllResult.error }, "Failed to get all users");
			return getAllResult;
		}

		logger.debug({ getAllResult: getAllResult.data }, "Users retrieved");

		const sanitizedUsers: Array<SafeSelectUser> = [];
		for (const user of getAllResult.data.items) {
			const sanitizeResult = this.sanitizeUser(user);
			if (!sanitizeResult.success) {
				logger.warn({ error: sanitizeResult.error }, "Failed to sanitize user");
				return sanitizeResult;
			}

			sanitizedUsers.push(sanitizeResult.data);
		}

		logger.info(
			{ totalUsers: getAllResult.data.meta.totalItems },
			"Users retrieved successfully",
		);

		return {
			data: {
				items: sanitizedUsers,
				meta: getAllResult.data.meta,
			},
			success: true,
		};
	}

	async getByEmail({
		email,
	}: MethodParams<IUserService, "getByEmail">): MethodReturn<
		IUserService,
		"getByEmail"
	> {
		const logger = this._getLogger({ method: "getByEmail" });
		logger.debug({ email }, "Getting user by email");

		const validationResult = this._validateEmail(email);
		if (!validationResult.success) {
			logger.warn({ error: validationResult.error }, "Invalid email");
			return validationResult;
		}

		logger.debug({ validatedEmail: validationResult.data }, "Validated email");

		const getByEmailResult = await this._repository.getByEmail({
			email: validationResult.data,
		});
		if (!getByEmailResult.success) {
			logger.warn(
				{ error: getByEmailResult.error },
				"Failed to get user by email",
			);
			return getByEmailResult;
		}
		if (!getByEmailResult.data) {
			logger.warn({ email }, "User not found");
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		logger.debug(
			{ getByEmailResult: getByEmailResult.data },
			"User retrieved by email",
		);

		const sanitizeResult = this.sanitizeUser(getByEmailResult.data);
		if (!sanitizeResult.success) {
			logger.warn({ error: sanitizeResult.error }, "Failed to sanitize user");
			return sanitizeResult;
		}

		logger.info(
			{ userId: sanitizeResult.data._id },
			"User retrieved by email successfully",
		);

		return {
			data: sanitizeResult.data,
			success: true,
		};
	}

	async getById({
		userId,
	}: MethodParams<IUserService, "getById">): MethodReturn<
		IUserService,
		"getById"
	> {
		const logger = this._getLogger({ method: "getById" });
		logger.debug({ userId }, "Getting user by ID");

		const validationResult = this._validateUserId(userId);
		if (!validationResult.success) {
			logger.warn({ error: validationResult.error, userId }, "Invalid user ID");
			return validationResult;
		}

		logger.debug(
			{ validatedUserId: validationResult.data },
			"Validated user ID",
		);

		const getByIdResult = await this._repository.getById({
			userId: validationResult.data,
		});
		if (!getByIdResult.success) {
			logger.warn({ error: getByIdResult.error }, "Failed to get user by ID");
			return getByIdResult;
		}
		if (!getByIdResult.data) {
			logger.warn({ userId }, "User not found");
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		logger.debug({ getByIdResult: getByIdResult.data }, "User retrieved by ID");

		const sanitizeResult = this.sanitizeUser(getByIdResult.data);
		if (!sanitizeResult.success) {
			logger.warn(
				{ error: sanitizeResult.error, userId },
				"Failed to sanitize user",
			);
			return sanitizeResult;
		}

		logger.info({ userId }, "User retrieved by ID successfully");
		return {
			data: sanitizeResult.data,
			success: true,
		};
	}

	async updateById({
		data,
		userId,
	}: MethodParams<IUserService, "updateById">): MethodReturn<
		IUserService,
		"updateById"
	> {
		const logger = this._getLogger({ method: "updateById" });
		logger.debug({ data, userId }, "Updating user by ID");

		const userIdValidationResult = this._validateUserId(userId);
		if (!userIdValidationResult.success) {
			logger.warn(
				{ error: userIdValidationResult.error, userId },
				"Invalid user ID",
			);
			return userIdValidationResult;
		}

		logger.debug(
			{ validatedUserId: userIdValidationResult.data },
			"Validated user ID",
		);

		const updateDataValidationResult = this._validateUpdateData(data);
		if (!updateDataValidationResult.success) {
			logger.warn(
				{ error: updateDataValidationResult.error, userId },
				"Invalid update data",
			);
			return updateDataValidationResult;
		}

		logger.debug(
			{ validatedUpdateData: updateDataValidationResult.data },
			"Validated update data",
		);

		const updateResult = await this._repository.update({
			data: updateDataValidationResult.data,
			userId: userIdValidationResult.data,
		});
		if (!updateResult.success) {
			logger.warn({ error: updateResult.error }, "Failed to update user by ID");
			return updateResult;
		}
		if (!updateResult.data) {
			logger.warn({ userId }, "User not found");
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		logger.debug({ updateResult: updateResult.data }, "User updated by ID");

		const sanitizeResult = this.sanitizeUser(updateResult.data);
		if (!sanitizeResult.success) {
			logger.warn(
				{ error: sanitizeResult.error, userId },
				"Failed to sanitize user",
			);
			return sanitizeResult;
		}

		logger.info(
			{ userId: sanitizeResult.data._id },
			"User updated by ID successfully",
		);
		return {
			data: sanitizeResult.data,
			success: true,
		};
	}

	// UNSAFE METHODS - returns full user object
	/****ONLY FOR INTERNAL USE***/
	public async create_UNSAFE(
		data: MethodParams<IUserService, "create_UNSAFE">,
	): MethodReturn<IUserService, "create_UNSAFE"> {
		const logger = this._getLogger({ method: "create_UNSAFE" });
		logger.debug({ data }, "Creating user (unsafe)");

		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			logger.warn({ error: validationResult.error }, "Invalid user data");
			return validationResult;
		}

		logger.debug(
			{ validatedData: validationResult.data },
			"Validated user data",
		);

		const createResult = await this._repository.create(validationResult.data);
		if (!createResult.success) {
			logger.warn({ error: createResult.error }, "Failed to create user");
			return createResult;
		}

		logger.info(
			{ userId: createResult.data._id },
			"User created (unsafe) successfully",
		);

		return {
			data: createResult.data,
			success: true,
		};
	}
	/****ONLY FOR INTERNAL USE***/
	public async getByEmail_UNSAFE(
		args: MethodParams<IUserService, "getByEmail_UNSAFE">,
	): MethodReturn<IUserService, "getByEmail_UNSAFE"> {
		const logger = this._getLogger({ method: "getByEmail_UNSAFE" });
		logger.debug({ args }, "Getting user by email (unsafe)");

		const validationResult = this._validateEmail(args.email);
		if (!validationResult.success) {
			logger.warn({ error: validationResult.error }, "Invalid email");
			return validationResult;
		}

		logger.debug({ validatedEmail: validationResult.data }, "Validated email");

		const getByEmailResult = await this._repository.getByEmail({
			email: validationResult.data,
		});
		if (!getByEmailResult.success) {
			logger.warn(
				{ error: getByEmailResult.error },
				"Failed to get user by email",
			);
			return getByEmailResult;
		}
		if (!getByEmailResult.data) {
			logger.warn({ email: args.email }, "User not found");
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		logger.info(
			{ userId: getByEmailResult.data._id },
			"User retrieved by email (unsafe) successfully",
		);

		return {
			data: getByEmailResult.data,
			success: true,
		};
	}
	/****ONLY FOR INTERNAL USE***/
	public async getById_UNSAFE(
		args: MethodParams<IUserService, "getById_UNSAFE">,
	): MethodReturn<IUserService, "getById_UNSAFE"> {
		const logger = this._getLogger({ method: "getById_UNSAFE" });
		logger.debug({ args }, "Getting user by ID (unsafe)");

		const validationResult = this._validateUserId(args.userId);
		if (!validationResult.success) {
			logger.warn({ error: validationResult.error }, "Invalid user ID");
			return validationResult;
		}

		logger.debug(
			{ validatedUserId: validationResult.data },
			"Validated user ID",
		);

		const getByIdResult = await this._repository.getById({
			userId: validationResult.data,
		});
		if (!getByIdResult.success) {
			logger.warn({ error: getByIdResult.error }, "Failed to get user by ID");
			return getByIdResult;
		}
		if (!getByIdResult.data) {
			logger.warn({ userId: args.userId }, "User not found");
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		logger.info(
			{ userId: getByIdResult.data._id },
			"User retrieved by ID (unsafe) successfully",
		);

		return {
			data: getByIdResult.data,
			success: true,
		};
	}

	public sanitizeUser(
		user: MethodParams<IUserService, "sanitizeUser">,
	): MethodReturn<IUserService, "sanitizeUser"> {
		const result = selectUserSchema.omit({ password: true }).safeParse(user);
		if (!result.success) {
			return {
				error: new InternalError("Invalid user data", { cause: result.error }),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "user service", ...args });
	}

	// Validation Methods
	private _validateCreateData(data: InsertUser): UserResult<InsertUser> {
		const result = insertUserSchema.safeParse(data);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid user data", {
					cause: result.error,
				}),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	private _validateEmail(email: string): UserResult<string> {
		const result = emailValidator.safeParse(email);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid email", { cause: result.error }),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	private _validateUpdateData(
		data: Partial<InsertUser>,
	): UserResult<Partial<InsertUser>> {
		const result = insertUserSchema.partial().safeParse(data);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid update data", {
					cause: result.error,
				}),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}

	private _validateUserId(userId: string): UserResult<Types.ObjectId> {
		const result = objectIdValidator.safeParse(userId);
		if (!result.success) {
			return {
				error: new ValidationError("Invalid user id", { cause: result.error }),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}
}
