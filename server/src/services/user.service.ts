import { Types } from "mongoose";
import { NotFoundError } from "../errors";
import { userRepository } from "../repositories";
import { InsertUser, SelectUser } from "../types";
import { generateToken } from "../utils";

class UserService {
  private readonly repository = userRepository;

  async getById({ userId }: { userId: Types.ObjectId }) {
    const user = await this.repository.getById({ userId });
    if (!user) throw new NotFoundError("User");

    return this._formatResponse(user);
  }

  async getByEmail({ email }: { email: string }): Promise<SelectUser> {
    const user = await this.repository.getByEmail({ email });
    if (!user) throw new NotFoundError("User");

    return user;
  }

  async getAll() {
    const users = await this.repository.getAll();

    return users.map((user) => this._formatResponse(user));
  }

  async updateById({
    userId,
    data,
  }: {
    userId: Types.ObjectId;
    data: Partial<InsertUser>;
  }) {
    const updatedUser = await this.repository.update({
      userId,
      data,
    });
    if (!updatedUser) throw new NotFoundError("User");

    return this._formatResponse(updatedUser);
  }

  async delete({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<SelectUser | null> {
    return await this.repository.delete({ userId });
  }

  private _formatResponse(user: Partial<SelectUser>, isTokenRequired = false) {
    return formatUserServiceResponse(user, isTokenRequired);
  }
}

export const userService = new UserService();
