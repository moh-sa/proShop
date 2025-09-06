import type { Types } from "mongoose";

import type { IUserRepository } from "../repositories/index.js";
import type { InsertUser, SelectUser } from "../types/index.js";

import { NotFoundError } from "../errors/index.js";
import { UserRepository } from "../repositories/index.js";

export interface IUserService {
	create: (data: InsertUser) => Promise<SelectUser>;
	delete: (data: { userId: Types.ObjectId }) => Promise<SelectUser>;
	getAll: () => Promise<Array<SelectUser>>;
	getByEmail: (data: { email: string }) => Promise<SelectUser>;
	getById: (data: { userId: Types.ObjectId }) => Promise<SelectUser>;
	updateById: (data: {
		data: Partial<InsertUser>;
		userId: Types.ObjectId;
	}) => Promise<SelectUser>;
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
}
