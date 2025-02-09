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
      return await this.db.findById(reviewId);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getAll({
    userId,
  }: {
    userId?: Types.ObjectId;
  }): Promise<Array<SelectReview>> {
    try {
      const options = userId ? { user: userId } : {};
      return await this.db.find(options);
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
      return await this.db.findByIdAndUpdate(reviewId, data, {
        new: true,
      });
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

  async count({ productId }: { productId: Types.ObjectId }): Promise<number> {
    try {
      return await this.db.countDocuments({ product: productId });
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async exists({
    userId,
    productId,
  }: {
    userId: Types.ObjectId;
    productId: Types.ObjectId;
  }): Promise<{ _id: Types.ObjectId } | null> {
    try {
      return await this.db.exists({
        user: userId,
        product: productId,
      });
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
