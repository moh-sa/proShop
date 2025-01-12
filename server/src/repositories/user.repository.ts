import User from "../models/userModel";
import { TInsertUser, TSelectUser } from "../types";

class UserRepository {
  async createUser({
    userData,
  }: {
    userData: TInsertUser;
  }): Promise<TSelectUser> {
    return User.create(userData);
  }

  async getUserById({
    userId,
  }: {
    userId: string;
  }): Promise<TSelectUser | null> {
    return User.findById(userId);
  }

  async getUserByEmail({
    email,
  }: {
    email: string;
  }): Promise<TSelectUser | null> {
    return User.findOne({ email });
  }

  async updateUser({
    userId,
    updateData,
  }: {
    userId: string;
    updateData: Partial<TInsertUser>;
  }): Promise<TSelectUser | null> {
    return User.findByIdAndUpdate(userId, updateData, { new: true });
  }

  async deleteUser({ userId }: { userId: string }): Promise<void> {
    await User.findByIdAndDelete(userId);
  }

  async getAllUsers(): Promise<Array<TSelectUser>> {
    return User.find({});
  }
}

export const userRepository = new UserRepository();
