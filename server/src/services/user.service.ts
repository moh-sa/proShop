import type { Types } from "mongoose";

import type { IUserRepository } from "../repositories/index.js";
import type {
	InsertUser,
	SafeSelectUser,
	SelectUser,
	UnSafeSelectUser,
} from "../types/index.js";

import { InternalError, NotFoundError } from "../errors/index.js";
import { UserRepository } from "../repositories/index.js";
import { selectUserSchema } from "../schemas/index.js";

export interface IUserService {
	create: (data: InsertUser) => Promise<SelectUser>;
	delete: (data: { userId: Types.ObjectId }) => Promise<SelectUser>;
	existsByEmail: (data: {
		email: string;
	}) => Promise<null | { _id: Types.ObjectId }>;
	getAll: () => Promise<Array<SelectUser>>;
	getByEmail: (data: { email: string }) => Promise<SelectUser>;
	getById: (data: { userId: Types.ObjectId }) => Promise<SelectUser>;
	updateById: (data: {
		data: Partial<InsertUser>;
		userId: Types.ObjectId;
	}) => Promise<SelectUser>;

	// UNSAFE METHODS - returns full user object
	/****ONLY FOR INTERNAL USE***/
	create_UNSAFE: (data: InsertUser) => Promise<UnSafeSelectUser>;
	/****ONLY FOR INTERNAL USE***/
	getByEmail_UNSAFE: (data: { email: string }) => Promise<UnSafeSelectUser>;
	/****ONLY FOR INTERNAL USE***/
	getById_UNSAFE: (data: {
		userId: Types.ObjectId;
	}) => Promise<UnSafeSelectUser>;
}

export class UserService implements IUserService {
	private readonly _repository: IUserRepository;

	constructor(repository: IUserRepository = new UserRepository()) {
		this._repository = repository;
	}
	async create(data: InsertUser): Promise<SelectUser> {
		return await this._repository.create(data);
	}

	async delete({ userId }: { userId: Types.ObjectId }): Promise<SelectUser> {
		const user = await this._repository.delete({ userId });
		if (!user) {
			throw new NotFoundError("User");
		}

		return user;
	}

	public async existsByEmail({
		email,
	}: {
		email: string;
	}): Promise<null | { _id: Types.ObjectId }> {
		return await this._repository.existsByEmail({ email });
	}

	async getAll(): Promise<Array<SelectUser>> {
		const users = await this._repository.getAll();

		return users;
	}

	async getByEmail({ email }: { email: string }): Promise<SelectUser> {
		const user = await this._repository.getByEmail({ email });
		if (!user) {
			throw new NotFoundError("User");
		}

		return user;
	}

	async getById({ userId }: { userId: Types.ObjectId }): Promise<SelectUser> {
		const user = await this._repository.getById({ userId });
		if (!user) {
			throw new NotFoundError("User");
		}

		return user;
	}

	async updateById({
		data,
		userId,
	}: {
		data: Partial<InsertUser>;
		userId: Types.ObjectId;
	}): Promise<SelectUser> {
		const updatedUser = await this._repository.update({
			data,
			userId,
		});
		if (!updatedUser) {
			throw new NotFoundError("User");
		}

		return updatedUser;
	}

	// UNSAFE METHODS - returns full user object
	/****ONLY FOR INTERNAL USE***/
	public async create_UNSAFE(data: InsertUser): Promise<UnSafeSelectUser> {
		const user = await this._repository.create(data);

		return user;
	}
	/****ONLY FOR INTERNAL USE***/
	public async getByEmail_UNSAFE(args: {
		email: string;
	}): Promise<UnSafeSelectUser> {
		const user = await this._repository.getByEmail({ email: args.email });
		if (!user) {
			throw new NotFoundError("User");
		}

		return user;
	}
	/****ONLY FOR INTERNAL USE***/
	public async getById_UNSAFE(args: {
		userId: Types.ObjectId;
	}): Promise<UnSafeSelectUser> {
		const user = await this._repository.getById({ userId: args.userId });
		if (!user) {
			throw new NotFoundError("User");
		}

		return user;
	}

	private _sanitizeUser(user: SelectUser): SafeSelectUser {
		const result = selectUserSchema.omit({ password: true }).safeParse(user);
		if (!result.success) {
			throw new InternalError("Invalid user data", { cause: result.error });
		}

		return result.data;
	}
}
