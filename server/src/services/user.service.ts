import type { Types } from "mongoose";

import type { IUserRepository } from "../repositories/index.js";
import type { InsertUser, SelectUser } from "../types/index.js";

import { NotFoundError } from "../errors/index.js";
import { UserRepository } from "../repositories/index.js";
import { formatUserServiceResponse } from "../utils/format-user-service-response.util.js";

export interface IUserService {
	delete: (data: { userId: Types.ObjectId }) => Promise<UserWithoutPassword>;
	getAll: () => Promise<Array<UserWithoutPassword>>;
	getByEmail: (data: { email: string }) => Promise<UserWithoutPassword>;
	getById: (data: { userId: Types.ObjectId }) => Promise<UserWithoutPassword>;
	updateById: (data: {
		data: Partial<InsertUser>;
		userId: Types.ObjectId;
	}) => Promise<UserWithoutPassword>;
}

type UserWithoutPassword = Omit<SelectUser, "password">;

export class UserService implements IUserService {
	private readonly _repository: IUserRepository;

	constructor(repository: IUserRepository = new UserRepository()) {
		this._repository = repository;
	}

	async delete({
		userId,
	}: {
		userId: Types.ObjectId;
	}): Promise<UserWithoutPassword> {
		const user = await this._repository.delete({ userId });
		if (!user) {
			throw new NotFoundError("User");
		}

		return this._formatResponse({ user });
	}

	async getAll(): Promise<Array<UserWithoutPassword>> {
		const users = await this._repository.getAll();

		return users.map((user) => this._formatResponse({ user }));
	}

	async getByEmail({ email }: { email: string }): Promise<UserWithoutPassword> {
		const user = await this._repository.getByEmail({ email });
		if (!user) {
			throw new NotFoundError("User");
		}

		return this._formatResponse({ user });
	}

	async getById({ userId }: { userId: Types.ObjectId }) {
		const user = await this._repository.getById({ userId });
		if (!user) {
			throw new NotFoundError("User");
		}

		return this._formatResponse({ user });
	}

	async updateById({
		data,
		userId,
	}: {
		data: Partial<InsertUser>;
		userId: Types.ObjectId;
	}): Promise<UserWithoutPassword> {
		const updatedUser = await this._repository.update({
			data,
			userId,
		});
		if (!updatedUser) {
			throw new NotFoundError("User");
		}

		return this._formatResponse({ user: updatedUser });
	}

	private _formatResponse({
		isTokenRequired = false,
		user,
	}: {
		isTokenRequired?: boolean;
		user: SelectUser;
	}) {
		return formatUserServiceResponse({ isTokenRequired, user });
	}
}
