import mongoose, { Error as MongooseError, Types } from "mongoose";
import { DatabaseError } from "../errors";
import User from "../models/userModel";
import { InsertUser, SelectUser } from "../types";

class UserRepository {
  private readonly db = User;

  async create(data: InsertUser): Promise<Omit<SelectUser, "token">> {
    try {
      return (await this.db.create(data)).toObject();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getById({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<SelectUser | null> {
    try {
      return await this.db.findById(userId).lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getByEmail({ email }: { email: string }): Promise<SelectUser | null> {
    try {
      return await this.db.findOne({ email }).lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async update({
    userId,
    updateData,
  }: {
    userId: Types.ObjectId;
    updateData: Partial<InsertUser>;
  }): Promise<SelectUser | null> {
    try {
      return await this.db
        .findByIdAndUpdate(userId, updateData, { new: true })
        .lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async delete({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<SelectUser | null> {
    try {
      return await this.db.findByIdAndDelete(userId).lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getAll(): Promise<Array<SelectUser>> {
    try {
      return await this.db.find({}).lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  private errorHandler(error: unknown): never {
    if (
      error instanceof MongooseError ||
      error instanceof mongoose.mongo.MongoError
    ) {
      throw new DatabaseError(error.message);
    }
    throw new DatabaseError();
  }
}

export const userRepository = new UserRepository();
