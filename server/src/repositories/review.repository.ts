import { Types } from "mongoose";
import Review from "../models/review.model";
import { InsertReview, SelectReview } from "../types";
import { handleDatabaseError } from "../utils";

export interface IReviewRepository {
  create: (data: InsertReview) => Promise<SelectReview>;
  getById: (data: { reviewId: Types.ObjectId }) => Promise<SelectReview | null>;
  getAll: () => Promise<Array<SelectReview>>;
  getAllByUserId: (data: {
    userId: Types.ObjectId;
  }) => Promise<Array<SelectReview>>;
  getAllByProductId: (data: {
    productId: Types.ObjectId;
  }) => Promise<Array<SelectReview>>;
  update: (data: {
    reviewId: Types.ObjectId;
    data: Partial<InsertReview>;
  }) => Promise<SelectReview | null>;
  delete: (data: { reviewId: Types.ObjectId }) => Promise<SelectReview | null>;
  count: () => Promise<number>;
  countByUserId: (data: { userId: Types.ObjectId }) => Promise<number>;
  countByProductId: (data: { productId: Types.ObjectId }) => Promise<number>;
  existsById: (data: {
    reviewId: Types.ObjectId;
  }) => Promise<{ _id: Types.ObjectId } | null>;
  existsByUserIdAndProductId: (data: {
    userId: Types.ObjectId;
    productId: Types.ObjectId;
  }) => Promise<{ _id: Types.ObjectId } | null>;
}

export class ReviewRepository implements IReviewRepository {
  private readonly _db: typeof Review;

  constructor(db: typeof Review = Review) {
    this._db = db;
  }

  async create(data: InsertReview): Promise<SelectReview> {
    try {
      return (await this._db.create(data)).toObject();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getById({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<SelectReview | null> {
    try {
      return await this._db.findById(reviewId).lean();
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

  async update({
    reviewId,
    data,
  }: {
    reviewId: Types.ObjectId;
    data: Partial<InsertReview>;
  }): Promise<SelectReview | null> {
    try {
      return await this._db
        .findByIdAndUpdate(reviewId, data, { new: true })
        .lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async delete({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<SelectReview | null> {
    try {
      return await this._db.findByIdAndDelete(reviewId).lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async count(): Promise<number> {
    try {
      return await this._db.countDocuments().lean();
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

  async existsById({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<{ _id: Types.ObjectId } | null> {
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
    userId,
    productId,
  }: {
    userId: Types.ObjectId;
    productId: Types.ObjectId;
  }): Promise<{ _id: Types.ObjectId } | null> {
    try {
      return await this._db
        .exists({
          user: userId,
          product: productId,
        })
        .lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  private _errorHandler(error: unknown): never {
    return handleDatabaseError(error);
  }
}
