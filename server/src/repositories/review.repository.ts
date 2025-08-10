import type { Types } from "mongoose";

import type { InsertReview, SelectReview } from "../types/index.js";

import Review from "../models/review.model.js";
import { handleDatabaseError } from "../utils/index.js";

export interface IReviewRepository {
  count: () => Promise<number>;
  countByProductId: (data: { productId: Types.ObjectId }) => Promise<number>;
  countByUserId: (data: { userId: Types.ObjectId }) => Promise<number>;
  create: (data: InsertReview) => Promise<SelectReview>;
  delete: (data: { reviewId: Types.ObjectId }) => Promise<null | SelectReview>;
  existsById: (data: {
    reviewId: Types.ObjectId;
  }) => Promise<null | { _id: Types.ObjectId }>;
  existsByUserIdAndProductId: (data: {
    productId: Types.ObjectId;
    userId: Types.ObjectId;
  }) => Promise<null | { _id: Types.ObjectId }>;
  getAll: () => Promise<Array<SelectReview>>;
  getAllByProductId: (data: {
    productId: Types.ObjectId;
  }) => Promise<Array<SelectReview>>;
  getAllByUserId: (data: {
    userId: Types.ObjectId;
  }) => Promise<Array<SelectReview>>;
  getById: (data: { reviewId: Types.ObjectId }) => Promise<null | SelectReview>;
  update: (data: {
    data: Partial<InsertReview>;
    reviewId: Types.ObjectId;
  }) => Promise<null | SelectReview>;
}

export class ReviewRepository implements IReviewRepository {
  private readonly _db: typeof Review;

  constructor(db: typeof Review = Review) {
    this._db = db;
  }

  async count(): Promise<number> {
    try {
      return await this._db.countDocuments().lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async countByProductId({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<number> {
    try {
      return await this._db.countDocuments({ product: productId }).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async countByUserId({ userId }: { userId: Types.ObjectId }): Promise<number> {
    try {
      return await this._db.countDocuments({ user: userId }).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async create(data: InsertReview): Promise<SelectReview> {
    try {
      return (await this._db.create(data)).toObject();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async delete({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<null | SelectReview> {
    try {
      return await this._db.findByIdAndDelete(reviewId).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async existsById({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<null | { _id: Types.ObjectId }> {
    try {
      return await this._db
        .exists({
          _id: reviewId,
        })
        .lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async existsByUserIdAndProductId({
    productId,
    userId,
  }: {
    productId: Types.ObjectId;
    userId: Types.ObjectId;
  }): Promise<null | { _id: Types.ObjectId }> {
    try {
      return await this._db
        .exists({
          product: productId,
          user: userId,
        })
        .lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getAll(): Promise<Array<SelectReview>> {
    try {
      return await this._db.find({}).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getAllByProductId({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<Array<SelectReview>> {
    try {
      return await this._db.find({ product: productId }).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getAllByUserId({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<Array<SelectReview>> {
    try {
      return await this._db.find({ user: userId }).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getById({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<null | SelectReview> {
    try {
      return await this._db.findById(reviewId).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async update({
    data,
    reviewId,
  }: {
    data: Partial<InsertReview>;
    reviewId: Types.ObjectId;
  }): Promise<null | SelectReview> {
    try {
      return await this._db
        .findByIdAndUpdate(reviewId, data, { new: true })
        .lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  private _errorHandler(error: unknown): never {
    return handleDatabaseError(error);
  }
}
