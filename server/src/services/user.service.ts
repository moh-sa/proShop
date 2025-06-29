import { Types } from "mongoose";
import { NotFoundError } from "../errors";
import { IUserRepository, UserRepository } from "../repositories";
import { InsertUser, SelectUser } from "../types";
import { formatUserServiceResponse } from "../utils/format-user-service-response.util";

type UserWithoutPassword = Omit<SelectUser, "password">;

export interface IUserService {
  getById: (data: { userId: Types.ObjectId }) => Promise<UserWithoutPassword>;
  getByEmail: (data: { email: string }) => Promise<SelectUser>;
  getAll: () => Promise<Array<UserWithoutPassword>>;
  updateById: (data: {
    userId: Types.ObjectId;
    data: Partial<InsertUser>;
  }) => Promise<UserWithoutPassword>;
  delete: (data: { userId: Types.ObjectId }) => Promise<SelectUser | null>;
}

export class UserService implements IUserService {
  private readonly _repository: IUserRepository;

  constructor(repository: IUserRepository = new UserRepository()) {
    this._repository = repository;
  }

  async getById({ userId }: { userId: Types.ObjectId }) {
    const user = await this._repository.getById({ userId });
    if (!user) throw new NotFoundError("User");

    return this._formatResponse({ user });
  }

  async getByEmail({ email }: { email: string }): Promise<SelectUser> {
    const user = await this._repository.getByEmail({ email });
    if (!user) throw new NotFoundError("User");

    return user;
  }

  async getAll(): Promise<Array<UserWithoutPassword>> {
    const users = await this._repository.getAll();

    return users.map((user) => this._formatResponse({ user }));
  }

  async updateById({
    userId,
    data,
  }: {
    userId: Types.ObjectId;
    data: Partial<InsertUser>;
  }): Promise<UserWithoutPassword> {
    const updatedUser = await this._repository.update({
      userId,
      data,
    });
    if (!updatedUser) throw new NotFoundError("User");

    return this._formatResponse({ user: updatedUser });
  }

  async delete({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<SelectUser | null> {
    return await this._repository.delete({ userId });
  }

  private _formatResponse({
    user,
    isTokenRequired = false,
  }: {
    user: SelectUser;
    isTokenRequired?: boolean;
  }) {
    return formatUserServiceResponse({ user, isTokenRequired });
  }
}
