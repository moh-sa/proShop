import { Types } from "mongoose";
import { NotFoundError } from "../errors";
import { reviewRepository } from "../repositories";
import { InsertReview, SelectReview } from "../types";

class ReviewService {
  private readonly repo = reviewRepository;

  async create({ data }: { data: InsertReview }): Promise<SelectReview> {
    return await this.repo.create({ data });
  }

  async getById({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<SelectReview> {
    const review = await this.repo.getById({ reviewId });
    if (!review) throw new NotFoundError("Review");

    return review;
  }

  async getAll(): Promise<Array<SelectReview>> {
    return await this.repo.getAll({});
  }

  async getAllByUserId({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<Array<SelectReview>> {
    return await this.repo.getAll({ userId });
  }

  async update({
    reviewId,
    data,
  }: {
    reviewId: Types.ObjectId;
    data: Partial<InsertReview>;
  }): Promise<SelectReview> {
    const updatedReview = await this.repo.update({ reviewId, data });
    if (!updatedReview) throw new NotFoundError("Review");

    return updatedReview;
  }

  async delete({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<SelectReview | null> {
    const review = await this.repo.delete({ reviewId });
    if (!review) throw new NotFoundError("Review");

    return review;
  }

  async count({ productId }: { productId: Types.ObjectId }): Promise<number> {
    return await this.repo.count({ productId });
  }

  async exists({
    userId,
    productId,
  }: {
    userId: Types.ObjectId;
    productId: Types.ObjectId;
  }): Promise<{ _id: Types.ObjectId }> {
    const review = await this.repo.exists({ userId, productId });
    if (!review) throw new NotFoundError("Review");

    return review;
  }
}

export const reviewService = new ReviewService();
