import { Types } from "mongoose";
import User from "../models/userModel";
import { InsertUser, SelectUser } from "../types";
import { handleDatabaseError } from "../utils";

export interface IUserRepository {
  create(data: InsertUser): Promise<Omit<SelectUser, "token">>;
  getById(data: { userId: Types.ObjectId }): Promise<SelectUser | null>;
  getByEmail(data: { email: string }): Promise<SelectUser | null>;
  update(data: {
    userId: Types.ObjectId;
    data: Partial<InsertUser>;
  }): Promise<SelectUser | null>;
  delete(data: { userId: Types.ObjectId }): Promise<SelectUser | null>;
  getAll(): Promise<Array<SelectUser>>;
  existsByEmail(data: {
    email: string;
  }): Promise<{ _id: Types.ObjectId } | null>;
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

  async getById({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<SelectUser | null> {
    try {
      return await this._db.findById(userId).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getByEmail({ email }: { email: string }): Promise<SelectUser | null> {
    try {
      return await this._db.findOne({ email }).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async update({
    userId,
    data,
  }: {
    userId: Types.ObjectId;
    data: Partial<InsertUser>;
  }): Promise<SelectUser | null> {
    try {
      return await this._db
        .findByIdAndUpdate(userId, data, { new: true })
        .lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async delete({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<SelectUser | null> {
    try {
      return await this._db.findByIdAndDelete(userId).lean();
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

  async existsByEmail({
    email,
  }: {
    email: string;
  }): Promise<{ _id: Types.ObjectId } | null> {
    try {
      return await this._db.exists({ email }).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  private _errorHandler(error: unknown): never {
    return handleDatabaseError(error);
  }
}
