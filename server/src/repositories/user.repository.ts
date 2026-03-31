import type { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	FailureResult,
	GetAllUsersRepositoryParams,
	InsertUser,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	PaginationQuery,
	Result,
	SelectUser,
	UserFilter,
} from "../types/index.js";
import type { PaginatorParams } from "../utils/index.js";

import User from "../models/user.model.js";
import {
	buildMongoSelectProjection,
	handleDatabaseErrorResult,
	Paginator,
} from "../utils/index.js";

export interface IUserRepository {
	create(data: InsertUser): Promise<UserResult<SelectUser>>;
	delete(data: {
		userId: Types.ObjectId;
	}): Promise<UserResult<null | SelectUser>>;
	existsByEmail(data: {
		email: string;
	}): Promise<UserResult<null | { _id: Types.ObjectId }>>;
	getAll(
		args: GetAllUsersRepositoryParams,
	): Promise<UserResult<PaginatedResponse<SelectUser>>>;
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

	constructor(db?: typeof User) {
		this._db = db ?? User;
		this._paginator = new Paginator(this._db);
	}

	public async create(
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

	public async delete({
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

	public async existsByEmail({
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

	public async getAll(
		args: MethodParams<IUserRepository, "getAll">,
	): MethodReturn<IUserRepository, "getAll"> {
		try {
			const result = await this._paginateUsers(args);

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getByEmail({
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

	public async getById({
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

	public async update({
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

	private async _paginateUsers(
		args: GetAllUsersRepositoryParams,
		query?: Partial<PaginationQuery<SelectUser>>,
	): Promise<PaginatedResponse<SelectUser>> {
		const paginateOptions: PaginatorParams<SelectUser> = {
			pageNumber: args.pageNumber,
			pageSize: args.pageSize,
		};

		if (args.filters) {
			const filters = this._prepareFilters(args.filters);
			paginateOptions.query = { ...filters };
		}

		if (query) {
			paginateOptions.query = { ...paginateOptions.query, ...query };
		}

		if (args.select) {
			const select = buildMongoSelectProjection(args.select);
			paginateOptions.pipeline = [{ $project: select }];
		}

		if (args.sort) {
			paginateOptions.sort = args.sort;
		}

		return this._paginator.paginate<SelectUser>(paginateOptions);
	}

	private _prepareFilters(
		filters?: UserFilter,
	): Partial<PaginationQuery<SelectUser>> {
		if (!filters) {
			return {};
		}

		const newFilter: Partial<PaginationQuery<SelectUser>> = {};

		if (filters.name) {
			newFilter.name = { $options: "i", $regex: filters.name };
		}

		if (filters.email) {
			newFilter.email = filters.email;
		}

		if (filters.isAdmin !== undefined) {
			newFilter.isAdmin = filters.isAdmin;
		}

		return newFilter;
	}
}

export const userRepository = new UserRepository();
