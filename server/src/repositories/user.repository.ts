import type { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	FailureResult,
	InsertUser,
	MethodParams,
	MethodReturn,
	Result,
	SelectUser,
} from "../types/index.js";

import User from "../models/user.model.js";
import { handleDatabaseErrorResult, Paginator } from "../utils/index.js";

export interface IUserRepository {
	create(data: InsertUser): Promise<UserResult<SelectUser>>;
	delete(data: {
		userId: Types.ObjectId;
	}): Promise<UserResult<null | SelectUser>>;
	existsByEmail(data: {
		email: string;
	}): Promise<UserResult<null | { _id: Types.ObjectId }>>;
	getAll(): Promise<UserResult<Array<SelectUser>>>;
	getByEmail(data: { email: string }): Promise<UserResult<null | SelectUser>>;
	getById(data: {
		userId: Types.ObjectId;
	}): Promise<UserResult<null | SelectUser>>;
	update(data: {
		data: Partial<InsertUser>;
		userId: Types.ObjectId;
	}): Promise<UserResult<null | SelectUser>>;
}

type UserResult<T> = Result<T, DatabaseBaseError>;

export class UserRepository implements IUserRepository {
	private readonly _db: typeof User;
	private _paginator: Paginator<SelectUser>;

	constructor(db: typeof User = User) {
		this._db = db;
		this._paginator = new Paginator(this._db);
	}

	async create(
		data: MethodParams<IUserRepository, "create">,
	): MethodReturn<IUserRepository, "create"> {
		try {
			const result = await this._db.create(data);

			return {
				data: result.toObject(),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async delete({
		userId,
	}: MethodParams<IUserRepository, "delete">): MethodReturn<
		IUserRepository,
		"delete"
	> {
		try {
			const result = await this._db.findByIdAndDelete(userId).lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async existsByEmail({
		email,
	}: MethodParams<IUserRepository, "existsByEmail">): MethodReturn<
		IUserRepository,
		"existsByEmail"
	> {
		try {
			const result = await this._db.exists({ email }).lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getAll(): MethodReturn<IUserRepository, "getAll"> {
		try {
			const result = await this._db.find({}).lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getByEmail({
		email,
	}: MethodParams<IUserRepository, "getByEmail">): MethodReturn<
		IUserRepository,
		"getByEmail"
	> {
		try {
			const result = await this._db.findOne({ email }).lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async getById({
		userId,
	}: MethodParams<IUserRepository, "getById">): MethodReturn<
		IUserRepository,
		"getById"
	> {
		try {
			const result = await this._db.findById(userId).lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	async update({
		data,
		userId,
	}: MethodParams<IUserRepository, "update">): MethodReturn<
		IUserRepository,
		"update"
	> {
		try {
			const result = await this._db
				.findByIdAndUpdate(userId, data, { new: true })
				.lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): FailureResult<DatabaseBaseError> {
		return handleDatabaseErrorResult(error);
	}
}
