import {
	InternalError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import type { IUserRepository } from "../repositories/index.js";
import { userRepository } from "../repositories/index.js";
import {
	createUserSchema,
	updateUserSchema,
	userPaginationParamsSchema,
	userSchema,
} from "../schemas/index.js";
import type {
	CreateUser,
	GetAllUsersServiceParams,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	Result,
	SafeSelectUser,
	UnSafeSelectUser,
	UpdateUserInput,
	User,
	UserSelect,
} from "../types/index.js";
import { getLoggerFromContext } from "../utils/index.js";
import {
	emailValidator,
	objectIdStringValidator,
} from "../validators/index.js";

export interface IUserService {
	create: (data: CreateUser) => Promise<UserResult<SafeSelectUser>>;
	delete: (data: { userId: string }) => Promise<UserResult<SafeSelectUser>>;
	existsByEmail: (data: {
		email: string;
	}) => Promise<UserResult<null | { id: string }>>;
	getAll: (
		args: GetAllUsersServiceParams,
	) => Promise<UserResult<PaginatedResponse<SafeSelectUser>>>;
	getByEmail: (data: { email: string }) => Promise<UserResult<SafeSelectUser>>;
	getById: (data: { userId: string }) => Promise<UserResult<SafeSelectUser>>;
	sanitizeUser: (user: User) => UserResult<SafeSelectUser>;
	updateById: (args: UpdateUserInput) => Promise<UserResult<SafeSelectUser>>;

	// UNSAFE METHODS - returns full user object
	/****ONLY FOR INTERNAL USE***/
	create_UNSAFE: (data: CreateUser) => Promise<UserResult<UnSafeSelectUser>>;
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

	constructor(repository?: IUserRepository) {
		this._repository = repository ?? userRepository;
	}

	public async create(
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
				{ error: sanitizeResult.error, userId: createdResult.data.id },
				"Failed to sanitize user",
			);
			return sanitizeResult;
		}

		logger.info(
			{ userId: sanitizeResult.data.id },
			"User created successfully",
		);
		return {
			data: sanitizeResult.data,
			success: true,
		};
	}

	public async delete({
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

	async existsByEmail({
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
			{ userId: existsResult.data.id },
			"User exists by email successfully",
		);

		return {
			data: existsResult.data,
			success: true,
		};
	}

	public async getAll(
		args: MethodParams<IUserService, "getAll">,
	): MethodReturn<IUserService, "getAll"> {
		const logger = this._getLogger({ method: "getAll" });
		logger.debug({ args }, "Getting all users");

		// validate arguments
		const argsValidationResult = userPaginationParamsSchema.safeParse(args);
		if (!argsValidationResult.success) {
			logger.warn(argsValidationResult.error, "Invalid arguments data");
			return {
				error: new ValidationError("Invalid arguments data", {
					cause: argsValidationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedArgs: argsValidationResult.data },
			"Validated arguments data",
		);

		// repository options
		const select: UserSelect = {
			createdAt: true,
			email: true,
			id: true,
			isAdmin: true,
			name: true,
			updatedAt: true,
		};

		const getAllResult = await this._repository.getAll({
			...argsValidationResult.data,
			select,
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

	public async getByEmail({
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
			{ userId: sanitizeResult.data.id },
			"User retrieved by email successfully",
		);

		return {
			data: sanitizeResult.data,
			success: true,
		};
	}

	public async getById({
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

	public async updateById(
		args: MethodParams<IUserService, "updateById">,
	): MethodReturn<IUserService, "updateById"> {
		const logger = this._getLogger({ method: "updateById" });
		logger.debug({ args }, "Updating user by ID");

		// arguments validation
		const argsValidationResult = updateUserSchema.safeParse(args);
		if (!argsValidationResult.success) {
			logger.warn(argsValidationResult.error, "Invalid arguments data");
			return {
				error: new ValidationError("Invalid arguments data", {
					cause: argsValidationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedArgs: argsValidationResult.data },
			"Validated arguments data",
		);

		// repository call
		const updateResult = await this._repository.update(
			argsValidationResult.data,
		);
		if (!updateResult.success) {
			logger.warn({ error: updateResult.error }, "Failed to update user by ID");
			return updateResult;
		}
		if (!updateResult.data) {
			logger.warn(
				{ userId: argsValidationResult.data.userId },
				"User not found",
			);
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		logger.debug({ updateResult: updateResult.data }, "User updated by ID");

		const sanitizeResult = this.sanitizeUser(updateResult.data);
		if (!sanitizeResult.success) {
			logger.warn(
				{
					error: sanitizeResult.error,
					userId: argsValidationResult.data.userId,
				},
				"Failed to sanitize user",
			);
			return sanitizeResult;
		}

		logger.info(
			{ userId: sanitizeResult.data.id },
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
			{ userId: createResult.data.id },
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
			{ userId: getByEmailResult.data.id },
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
			{ userId: getByIdResult.data.id },
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
		const result = userSchema.omit({ password: true }).safeParse(user);
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
	private _validateCreateData(data: CreateUser): UserResult<CreateUser> {
		const result = createUserSchema.safeParse(data);
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
		data: Partial<CreateUser>,
	): UserResult<Partial<CreateUser>> {
		const result = createUserSchema.partial().safeParse(data);
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

	private _validateUserId(userId: string): UserResult<string> {
		const result = objectIdStringValidator.safeParse(userId);
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

export const userService = new UserService();
