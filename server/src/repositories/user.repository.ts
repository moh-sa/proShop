import type { Types } from "mongoose";

import type {
	InsertUser,
	MethodParams,
	MethodReturn,
	SelectUser,
} from "../types/index.js";

import User from "../models/user.model.js";
import { handleDatabaseError } from "../utils/index.js";

export interface IUserRepository {
	create(data: InsertUser): Promise<SelectUser>;
	delete(data: { userId: Types.ObjectId }): Promise<null | SelectUser>;
	existsByEmail(data: {
		email: string;
	}): Promise<null | { _id: Types.ObjectId }>;
	getAll(): Promise<Array<SelectUser>>;
	getByEmail(data: { email: string }): Promise<null | SelectUser>;
	getById(data: { userId: Types.ObjectId }): Promise<null | SelectUser>;
	update(data: {
		data: Partial<InsertUser>;
		userId: Types.ObjectId;
	}): Promise<null | SelectUser>;
}

export class UserRepository implements IUserRepository {
	private readonly _db: typeof User;

	constructor(db: typeof User = User) {
		this._db = db;
	}

	async create(
		data: MethodParams<IUserRepository, "create">,
	): MethodReturn<IUserRepository, "create"> {
		try {
			return (await this._db.create(data)).toObject();
		} catch (error) {
			this._errorHandler(error);
		}
	}

	async delete({
		userId,
	}: MethodParams<IUserRepository, "delete">): MethodReturn<
		IUserRepository,
		"delete"
	> {
		try {
			return await this._db.findByIdAndDelete(userId).lean();
		} catch (error) {
			this._errorHandler(error);
		}
	}

	async existsByEmail({
		email,
	}: MethodParams<IUserRepository, "existsByEmail">): MethodReturn<
		IUserRepository,
		"existsByEmail"
	> {
		try {
			return await this._db.exists({ email }).lean();
		} catch (error) {
			this._errorHandler(error);
		}
	}

	async getAll(): MethodReturn<IUserRepository, "getAll"> {
		try {
			return await this._db.find({}).lean();
		} catch (error) {
			this._errorHandler(error);
		}
	}

	async getByEmail({
		email,
	}: MethodParams<IUserRepository, "getByEmail">): MethodReturn<
		IUserRepository,
		"getByEmail"
	> {
		try {
			return await this._db.findOne({ email }).lean();
		} catch (error) {
			this._errorHandler(error);
		}
	}

	async getById({
		userId,
	}: MethodParams<IUserRepository, "getById">): MethodReturn<
		IUserRepository,
		"getById"
	> {
		try {
			return await this._db.findById(userId).lean();
		} catch (error) {
			this._errorHandler(error);
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
			return await this._db
				.findByIdAndUpdate(userId, data, { new: true })
				.lean();
		} catch (error) {
			this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): never {
		return handleDatabaseError(error);
	}
}
