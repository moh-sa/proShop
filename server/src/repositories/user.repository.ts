import type { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	CreateUser,
	FailureResult,
	GetAllUsersRepositoryParams,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	PaginationQuery,
	Result,
	User,
	UserFilter,
} from "../types/index.js";

import { UserModel } from "../models/user.model.js";
import { handleDatabaseErrorResult, Paginator } from "../utils/index.js";

export interface IUserRepository {
	create(data: CreateUser): Promise<UserResult<User>>;
	delete(data: { userId: Types.ObjectId }): Promise<UserResult<null | User>>;
	existsByEmail(data: {
		email: string;
	}): Promise<UserResult<null | { _id: Types.ObjectId }>>;
	getAll(
		args: GetAllUsersRepositoryParams,
	): Promise<UserResult<PaginatedResponse<User>>>;
	getByEmail(data: { email: string }): Promise<UserResult<null | User>>;
	getById(data: { userId: Types.ObjectId }): Promise<UserResult<null | User>>;
	update(data: {
		data: Partial<CreateUser>;
		userId: Types.ObjectId;
	}): Promise<UserResult<null | User>>;
}

type UserResult<T> = Result<T, DatabaseBaseError>;

export class UserRepository implements IUserRepository {
	private readonly _db: typeof UserModel;
	private _paginator: Paginator<User>;

	constructor(db?: typeof UserModel) {
		this._db = db ?? UserModel;
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
			const result = await this._paginator.paginate<User>({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: args.filters && this._prepareFilters(args.filters),
				select: args.select,
				sort: args.sort,
			});

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
				.findByIdAndUpdate(userId, data, { returnDocument: "after" })
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

	private _prepareFilters(
		filters?: UserFilter,
	): Partial<PaginationQuery<User>> {
		if (!filters) {
			return {};
		}

		const newFilter: Partial<PaginationQuery<User>> = {};

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
