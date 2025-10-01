import type { Types } from "mongoose";

import type { IUserRepository } from "../repositories/index.js";
import type {
	InsertUser,
	MethodParams,
	MethodReturn,
	Result,
	SafeSelectUser,
	SelectUser,
	UnSafeSelectUser,
} from "../types/index.js";

import {
	InternalError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import { UserRepository } from "../repositories/index.js";
import { insertUserSchema, selectUserSchema } from "../schemas/index.js";
import { emailValidator, objectIdValidator } from "../validators/index.js";

export interface IUserService {
	create: (data: InsertUser) => Promise<SafeSelectUser>;
	delete: (data: { userId: string }) => Promise<SafeSelectUser>;
	existsByEmail: (data: {
		email: string;
	}) => Promise<null | { _id: Types.ObjectId }>;
	getAll: () => Promise<Array<SafeSelectUser>>;
	getByEmail: (data: { email: string }) => Promise<SafeSelectUser>;
	getById: (data: { userId: string }) => Promise<SafeSelectUser>;
	sanitizeUser: (user: SelectUser) => SafeSelectUser;
	updateById: (data: {
		data: Partial<InsertUser>;
		userId: string;
	}) => Promise<SafeSelectUser>;

	// UNSAFE METHODS - returns full user object
	/****ONLY FOR INTERNAL USE***/
	create_UNSAFE: (data: InsertUser) => Promise<UnSafeSelectUser>;
	/****ONLY FOR INTERNAL USE***/
	getByEmail_UNSAFE: (data: { email: string }) => Promise<UnSafeSelectUser>;
	/****ONLY FOR INTERNAL USE***/
	getById_UNSAFE: (data: { userId: string }) => Promise<UnSafeSelectUser>;
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
			throw validationResult.error;
		}

		const user = await this._repository.create(validationResult.data);
		const sanitizedUser = this.sanitizeUser(user);

		return sanitizedUser;
	}

	async delete({
		userId,
	}: MethodParams<IUserService, "delete">): MethodReturn<
		IUserService,
		"delete"
	> {
		const validationResult = this._validateUserId(userId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const user = await this._repository.delete({
			userId: validationResult.data,
		});
		if (!user) {
			throw new NotFoundError("User");
		}

		const sanitizedUser = this.sanitizeUser(user);
		return sanitizedUser;
	}

	public async existsByEmail({
		email,
	}: MethodParams<IUserService, "existsByEmail">): MethodReturn<
		IUserService,
		"existsByEmail"
	> {
		const validationResult = this._validateEmail(email);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		return await this._repository.existsByEmail({
			email: validationResult.data,
		});
	}

	async getAll(): MethodReturn<IUserService, "getAll"> {
		const users = await this._repository.getAll();

		const sanitizedUsers = users.map((user) => this.sanitizeUser(user));
		return sanitizedUsers;
	}

	async getByEmail({
		email,
	}: MethodParams<IUserService, "getByEmail">): MethodReturn<
		IUserService,
		"getByEmail"
	> {
		const validationResult = this._validateEmail(email);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const user = await this._repository.getByEmail({
			email: validationResult.data,
		});
		if (!user) {
			throw new NotFoundError("User");
		}
		const sanitizedUser = this.sanitizeUser(user);
		return sanitizedUser;
	}

	async getById({
		userId,
	}: MethodParams<IUserService, "getById">): MethodReturn<
		IUserService,
		"getById"
	> {
		const validationResult = this._validateUserId(userId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const user = await this._repository.getById({
			userId: validationResult.data,
		});
		if (!user) {
			throw new NotFoundError("User");
		}
		const sanitizedUser = this.sanitizeUser(user);

		return sanitizedUser;
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
			throw userIdValidationResult.error;
		}
		const updateDataValidationResult = this._validateUpdateData(data);
		if (!updateDataValidationResult.success) {
			throw updateDataValidationResult.error;
		}

		const updatedUser = await this._repository.update({
			data: updateDataValidationResult.data,
			userId: userIdValidationResult.data,
		});
		if (!updatedUser) {
			throw new NotFoundError("User");
		}

		const sanitizedUser = this.sanitizeUser(updatedUser);
		return sanitizedUser;
	}

	// UNSAFE METHODS - returns full user object
	/****ONLY FOR INTERNAL USE***/
	public async create_UNSAFE(
		data: MethodParams<IUserService, "create_UNSAFE">,
	): MethodReturn<IUserService, "create_UNSAFE"> {
		const validationResult = this._validateCreateData(data);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const user = await this._repository.create(validationResult.data);

		return user;
	}
	/****ONLY FOR INTERNAL USE***/
	public async getByEmail_UNSAFE(
		args: MethodParams<IUserService, "getByEmail_UNSAFE">,
	): MethodReturn<IUserService, "getByEmail_UNSAFE"> {
		const validationResult = this._validateEmail(args.email);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const user = await this._repository.getByEmail({
			email: validationResult.data,
		});
		if (!user) {
			throw new NotFoundError("User");
		}

		return user;
	}
	/****ONLY FOR INTERNAL USE***/
	public async getById_UNSAFE(
		args: MethodParams<IUserService, "getById_UNSAFE">,
	): MethodReturn<IUserService, "getById_UNSAFE"> {
		const validationResult = this._validateUserId(args.userId);
		if (!validationResult.success) {
			throw validationResult.error;
		}

		const user = await this._repository.getById({
			userId: validationResult.data,
		});
		if (!user) {
			throw new NotFoundError("User");
		}

		return user;
	}

	public sanitizeUser(
		user: MethodParams<IUserService, "sanitizeUser">,
	): MethodReturn<IUserService, "sanitizeUser"> {
		const result = selectUserSchema.omit({ password: true }).safeParse(user);
		if (!result.success) {
			throw new InternalError("Invalid user data", { cause: result.error });
		}

		return result.data;
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
