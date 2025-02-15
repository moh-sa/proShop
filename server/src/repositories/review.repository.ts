import mongoose, { Error as MongooseError, Types } from "mongoose";
import { DatabaseError } from "../errors";
import Review from "../models/review.model";
import { InsertReview, SelectReview } from "../types";

class ReviewRepository {
  private readonly db = Review;

  async create({ data }: { data: InsertReview }): Promise<SelectReview> {
    try {
      return await this.db.create(data);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getById({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<SelectReview | null> {
    try {
      return this.db.findById(reviewId);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getAll(): Promise<Array<SelectReview>> {
    try {
      return await this.db.find({});
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getAllByUserId({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<Array<SelectReview>> {
    try {
      return await this.db.find({ user: userId });
    } catch (error) {
      this.errorHandler(error);
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
      return await this.db.findByIdAndUpdate(reviewId, data, { new: true });
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async delete({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<SelectReview | null> {
    try {
      return await this.db.findByIdAndDelete(reviewId);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async count(): Promise<number> {
    try {
      return await this.db.countDocuments();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async countByUserId({ userId }: { userId: Types.ObjectId }): Promise<number> {
    try {
      return await this.db.countDocuments({ user: userId });
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

export const reviewRepository = new ReviewRepository();
