import { Types } from "mongoose";
import User from "../models/userModel";
import { InsertUser, SelectUser } from "../types";

class UserRepository {
  async createUser({
    userData,
  }: {
    userData: InsertUser;
  }): Promise<SelectUser> {
    return User.create(userData);
  }

  async getUserById({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<SelectUser | null> {
    return User.findById(userId);
  }

  async getUserByEmail({
    email,
  }: {
    email: string;
  }): Promise<SelectUser | null> {
    return User.findOne({ email });
  }

  async updateUser({
    userId,
    updateData,
  }: {
    userId: Types.ObjectId;
    updateData: Partial<InsertUser>;
  }): Promise<SelectUser | null> {
    return User.findByIdAndUpdate(userId, updateData, { new: true });
  }

  async deleteUser({ userId }: { userId: Types.ObjectId }): Promise<void> {
    await User.findByIdAndDelete(userId);
  }

  async getAllUsers(): Promise<Array<SelectUser>> {
    return User.find({});
  }
}

export const userRepository = new UserRepository();
