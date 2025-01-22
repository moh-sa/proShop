import { MongooseError, Types } from "mongoose";
import { DatabaseError } from "../errors";
import User from "../models/userModel";
import { InsertUser, SelectUser } from "../types";

class UserRepository {
  async createUser({
    userData,
  }: {
    userData: InsertUser;
  }): Promise<SelectUser> {
    try {
      return await User.create(userData);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getUserById({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<SelectUser | null> {
    try {
      return await User.findById(userId);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getUserByEmail({
    email,
  }: {
    email: string;
  }): Promise<SelectUser | null> {
    try {
      return await User.findOne({ email });
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async updateUser({
    userId,
    updateData,
  }: {
    userId: Types.ObjectId;
    updateData: Partial<InsertUser>;
  }): Promise<SelectUser | null> {
    try {
      return await User.findByIdAndUpdate(userId, updateData, { new: true });
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async deleteUser({ userId }: { userId: Types.ObjectId }): Promise<void> {
    try {
      await User.findByIdAndDelete(userId);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getAllUsers(): Promise<Array<SelectUser>> {
    try {
      return await User.find({});
    } catch (error) {
      this.errorHandler(error);
    }
  }

  private errorHandler(error: unknown): never {
    if (error instanceof MongooseError) {
      throw new DatabaseError(error.message);
    }
    throw new DatabaseError();
  }
}

export const userRepository = new UserRepository();
