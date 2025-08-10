import type { Types } from "mongoose";

import type { InsertUser, SelectUser } from "../types/index.js";

import User from "../models/userModel.js";
import { handleDatabaseError } from "../utils/index.js";

export interface IUserRepository {
  create(data: InsertUser): Promise<Omit<SelectUser, "token">>;
  delete(data: { userId: Types.ObjectId }): Promise<null | SelectUser>;
  existsByEmail(data: {
    email: string;
  }): Promise<null | { _id: Types.ObjectId }>;
  getAll(): Promise<Array<SelectUser>>;
  getByEmail(data: { email: string }): Promise<null | SelectUser>;
  getById(data: { userId: Types.ObjectId }): Promise<null | SelectUser>;
  update(data: {
    data: Partial<InsertUser>;
    userId: Types.ObjectId;
  }): Promise<null | SelectUser>;
}

export class UserRepository implements IUserRepository {
  private readonly _db: typeof User;

  constructor(db: typeof User = User) {
    this._db = db;
  }

  async create(data: InsertUser): Promise<Omit<SelectUser, "token">> {
    try {
      return (await this._db.create(data)).toObject();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async delete({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<null | SelectUser> {
    try {
      return await this._db.findByIdAndDelete(userId).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async existsByEmail({
    email,
  }: {
    email: string;
  }): Promise<null | { _id: Types.ObjectId }> {
    try {
      return await this._db.exists({ email }).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getAll(): Promise<Array<SelectUser>> {
    try {
      return await this._db.find({}).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getByEmail({ email }: { email: string }): Promise<null | SelectUser> {
    try {
      return await this._db.findOne({ email }).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getById({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<null | SelectUser> {
    try {
      return await this._db.findById(userId).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async update({
    data,
    userId,
  }: {
    data: Partial<InsertUser>;
    userId: Types.ObjectId;
  }): Promise<null | SelectUser> {
    try {
      return await this._db
        .findByIdAndUpdate(userId, data, { new: true })
        .lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  private _errorHandler(error: unknown): never {
    return handleDatabaseError(error);
  }
}
