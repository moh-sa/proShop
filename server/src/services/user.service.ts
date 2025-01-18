import { Types } from "mongoose";
import { userRepository } from "../repositories";
import { InsertUser, RequiredBy, SelectUser } from "../types";
import { generateToken } from "../utils";

class UserService {
  private readonly repository = userRepository;

  private createResponse(user: Partial<SelectUser>, includeToken = false) {
    const response: typeof user & { token?: string } = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    if (includeToken) response.token = generateToken({ id: user._id });
    return response;
  }

  signin(data: RequiredBy<InsertUser, "email" | "password">) {
    return this.createResponse(data, true);
  }

  async signup(data: InsertUser) {
    const user = await this.repository.createUser({ userData: data });
    return this.createResponse(user, true);
  }

  async getById({ userId }: { userId: Types.ObjectId }) {
    const user = await this.repository.getUserById({ userId });
    if (!user) throw new Error("User not found.");
    return this.createResponse(user);
  }

  async getAll() {
    const users = await this.repository.getAllUsers();
    return users.map((user) => this.createResponse(user));
  }

  async updateById({
    userId,
    updateData,
  }: {
    userId: Types.ObjectId;
    updateData: Partial<InsertUser>;
  }) {
    const updatedUser = await this.repository.updateUser({
      userId,
      updateData,
    });
    if (!updatedUser) throw new Error("User not found.");
    return this.createResponse(updatedUser);
  }

  async delete({ userId }: { userId: Types.ObjectId }) {
    await this.repository.deleteUser({ userId });
  }
}

export const userService = new UserService();
