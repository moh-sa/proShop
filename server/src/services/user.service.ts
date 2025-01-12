import { userRepository } from "../repositories";
import { TInsertUser, TSelectUser } from "../types";
import { generateToken } from "../utils";

class UserService {
  private readonly repository = userRepository;

  private createResponse(user: Partial<TSelectUser>, includeToken = false) {
    const response: typeof user & { token?: string } = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    if (includeToken) response.token = generateToken({ id: user._id });
    return response;
  }

  signin(data: Pick<TInsertUser, "email" | "password">) {
    return this.createResponse(data, true);
  }

  async signup(data: TInsertUser) {
    const user = await this.repository.createUser({ userData: data });
    return this.createResponse(user, true);
  }

  async getById({ userId }: { userId: string }) {
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
    userId: string;
    updateData: Partial<TInsertUser>;
  }) {
    const updatedUser = await this.repository.updateUser({
      userId,
      updateData,
    });
    if (!updatedUser) throw new Error("User not found.");
    return this.createResponse(updatedUser);
  }

  async delete({ userId }: { userId: string }) {
    await this.repository.deleteUser({ userId });
  }
}

export const userService = new UserService();
