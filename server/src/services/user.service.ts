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
	create: (data: InsertUser) => Promise<SafeSelectUser>;
	delete: (data: { userId: Types.ObjectId }) => Promise<SafeSelectUser>;
	existsByEmail: (data: {
		email: string;
	}) => Promise<null | { _id: Types.ObjectId }>;
	getAll: () => Promise<Array<SafeSelectUser>>;
	getByEmail: (data: { email: string }) => Promise<SafeSelectUser>;
	getById: (data: { userId: Types.ObjectId }) => Promise<SafeSelectUser>;
	sanitizeUser: (user: SelectUser) => SafeSelectUser;
	updateById: (data: {
		data: Partial<InsertUser>;
		userId: Types.ObjectId;
	}) => Promise<SafeSelectUser>;

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

	async create(data: InsertUser): Promise<SafeSelectUser> {
		const user = await this._repository.create(data);
		const sanitizedUser = this.sanitizeUser(user);

		return sanitizedUser;
	}

	async delete({
		userId,
	}: {
		userId: Types.ObjectId;
	}): Promise<SafeSelectUser> {
		const user = await this._repository.delete({ userId });
		if (!user) {
			throw new NotFoundError("User");
		}
		const sanitizedUser = this.sanitizeUser(user);

		return sanitizedUser;
	}

	public async existsByEmail({
		email,
	}: {
		email: string;
	}): Promise<null | { _id: Types.ObjectId }> {
		return await this._repository.existsByEmail({ email });
	}

	async getAll(): Promise<Array<SafeSelectUser>> {
		const users = await this._repository.getAll();
		const sanitizedUsers = users.map((user) => this.sanitizeUser(user));

		return sanitizedUsers;
	}

	async getByEmail({ email }: { email: string }): Promise<SafeSelectUser> {
		const user = await this._repository.getByEmail({ email });
		if (!user) {
			throw new NotFoundError("User");
		}
		const sanitizedUser = this.sanitizeUser(user);

		return sanitizedUser;
	}

	async getById({
		userId,
	}: {
		userId: Types.ObjectId;
	}): Promise<SafeSelectUser> {
		const user = await this._repository.getById({ userId });
		if (!user) {
			throw new NotFoundError("User");
		}
		const sanitizedUser = this.sanitizeUser(user);

		return sanitizedUser;
	}

	async updateById({
		data,
		userId,
	}: {
		data: Partial<InsertUser>;
		userId: Types.ObjectId;
	}): Promise<SafeSelectUser> {
		const updatedUser = await this._repository.update({
			data,
			userId,
		});
		if (!updatedUser) {
			throw new NotFoundError("User");
		}
		const sanitizedUser = this.sanitizeUser(updatedUser);

		return sanitizedUser;
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

	public sanitizeUser(user: SelectUser): SafeSelectUser {
		const result = selectUserSchema.omit({ password: true }).safeParse(user);
		if (!result.success) {
			throw new InternalError("Invalid user data", { cause: result.error });
		}

		return result.data;
	}
}
