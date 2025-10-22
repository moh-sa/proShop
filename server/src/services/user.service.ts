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
		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			return validationResult;
		}

		const createdResult = await this._repository.create(validationResult.data);
		if (!createdResult.success) {
			return createdResult;
		}

		const sanitizeResult = this.sanitizeUser(createdResult.data);
		if (!sanitizeResult.success) {
			return sanitizeResult;
		}

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
		const validationResult = this._validateUserId(userId);
		if (!validationResult.success) {
			return validationResult;
		}

		const deleteResult = await this._repository.delete({
			userId: validationResult.data,
		});
		if (!deleteResult.success) {
			return deleteResult;
		}
		if (!deleteResult.data) {
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		const sanitizeResult = this.sanitizeUser(deleteResult.data);
		if (!sanitizeResult.success) {
			return sanitizeResult;
		}

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
		const validationResult = this._validateEmail(email);
		if (!validationResult.success) {
			return validationResult;
		}

		const existsResult = await this._repository.existsByEmail({
			email: validationResult.data,
		});
		if (!existsResult.success) {
			return existsResult;
		}

		return {
			data: existsResult.data,
			success: true,
		};
	}

	async getAll(
		args: MethodParams<IUserService, "getAll">,
	): MethodReturn<IUserService, "getAll"> {
		const paginationResult = paginationParamsValidator
			.omit({ query: true })
			.safeParse({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				sort: args.sort,
			});
		if (!paginationResult.success) {
			return {
				error: new ValidationError("Invalid pagination data", {
					cause: paginationResult.error,
				}),
				success: false,
			};
		}

		const queryResult = userQuerySchema.safeParse(args);
		if (!queryResult.success) {
			return {
				error: new ValidationError("Invalid query data", {
					cause: queryResult.error,
				}),
				success: false,
			};
		}

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
			return getAllResult;
		}

		const sanitizedUsers: Array<SafeSelectUser> = [];
		for (const user of getAllResult.data.items) {
			const sanitizeResult = this.sanitizeUser(user);
			if (!sanitizeResult.success) {
				return sanitizeResult;
			}

			sanitizedUsers.push(sanitizeResult.data);
		}

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
		const validationResult = this._validateEmail(email);
		if (!validationResult.success) {
			return validationResult;
		}

		const getByEmailResult = await this._repository.getByEmail({
			email: validationResult.data,
		});
		if (!getByEmailResult.success) {
			return getByEmailResult;
		}
		if (!getByEmailResult.data) {
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}
		const sanitizeResult = this.sanitizeUser(getByEmailResult.data);
		if (!sanitizeResult.success) {
			return sanitizeResult;
		}

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
		const validationResult = this._validateUserId(userId);
		if (!validationResult.success) {
			return validationResult;
		}

		const getByIdResult = await this._repository.getById({
			userId: validationResult.data,
		});
		if (!getByIdResult.success) {
			return getByIdResult;
		}
		if (!getByIdResult.data) {
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}
		const sanitizeResult = this.sanitizeUser(getByIdResult.data);
		if (!sanitizeResult.success) {
			return sanitizeResult;
		}

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
		const userIdValidationResult = this._validateUserId(userId);
		if (!userIdValidationResult.success) {
			return userIdValidationResult;
		}
		const updateDataValidationResult = this._validateUpdateData(data);
		if (!updateDataValidationResult.success) {
			return updateDataValidationResult;
		}

		const updateResult = await this._repository.update({
			data: updateDataValidationResult.data,
			userId: userIdValidationResult.data,
		});
		if (!updateResult.success) {
			return updateResult;
		}
		if (!updateResult.data) {
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		const sanitizeResult = this.sanitizeUser(updateResult.data);
		if (!sanitizeResult.success) {
			return sanitizeResult;
		}

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
		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			return validationResult;
		}

		const createResult = await this._repository.create(validationResult.data);
		if (!createResult.success) {
			return createResult;
		}

		return {
			data: createResult.data,
			success: true,
		};
	}
	/****ONLY FOR INTERNAL USE***/
	public async getByEmail_UNSAFE(
		args: MethodParams<IUserService, "getByEmail_UNSAFE">,
	): MethodReturn<IUserService, "getByEmail_UNSAFE"> {
		const validationResult = this._validateEmail(args.email);
		if (!validationResult.success) {
			return validationResult;
		}

		const getByEmailResult = await this._repository.getByEmail({
			email: validationResult.data,
		});
		if (!getByEmailResult.success) {
			return getByEmailResult;
		}
		if (!getByEmailResult.data) {
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		return {
			data: getByEmailResult.data,
			success: true,
		};
	}
	/****ONLY FOR INTERNAL USE***/
	public async getById_UNSAFE(
		args: MethodParams<IUserService, "getById_UNSAFE">,
	): MethodReturn<IUserService, "getById_UNSAFE"> {
		const validationResult = this._validateUserId(args.userId);
		if (!validationResult.success) {
			return validationResult;
		}

		const getByIdResult = await this._repository.getById({
			userId: validationResult.data,
		});
		if (!getByIdResult.success) {
			return getByIdResult;
		}
		if (!getByIdResult.data) {
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

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
