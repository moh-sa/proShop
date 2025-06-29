import { Types } from "mongoose";
import { NotFoundError } from "../errors";
import { IReviewRepository, ReviewRepository } from "../repositories";
import { InsertReview, SelectReview } from "../types";

export interface IReviewService {
  create: (data: InsertReview) => Promise<SelectReview>;
  getById: (data: { reviewId: Types.ObjectId }) => Promise<SelectReview>;
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
  }) => Promise<SelectReview>;
  delete: (data: { reviewId: Types.ObjectId }) => Promise<SelectReview>;
  count: () => Promise<number>;
  countByUserId: (data: { userId: Types.ObjectId }) => Promise<number>;
  countByProductId: (data: { productId: Types.ObjectId }) => Promise<number>;
  existsById: (data: {
    reviewId: Types.ObjectId;
  }) => Promise<{ _id: Types.ObjectId }>;
  existsByUserIdAndProductId: (data: {
    userId: Types.ObjectId;
    productId: Types.ObjectId;
  }) => Promise<{ _id: Types.ObjectId }>;
}
export class ReviewService implements IReviewService {
  private readonly repository: IReviewRepository;

  constructor(repository: IReviewRepository = new ReviewRepository()) {
    this.repository = repository;
  }

  async create(data: InsertReview): Promise<SelectReview> {
    return await this.repository.create(data);
  }

  async getById({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<SelectReview> {
    const review = await this.repository.getById({ reviewId });
    if (!review) throw new NotFoundError("Review");

    return review;
  }

  async getAll(): Promise<Array<SelectReview>> {
    return await this.repository.getAll();
  }

  async getAllByUserId({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<Array<SelectReview>> {
    return await this.repository.getAllByUserId({ userId });
  }

  async getAllByProductId({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<Array<SelectReview>> {
    return await this.repository.getAllByProductId({ productId });
  }

  async update({
    reviewId,
    data,
  }: {
    reviewId: Types.ObjectId;
    data: Partial<InsertReview>;
  }): Promise<SelectReview> {
    const updatedReview = await this.repository.update({
      reviewId,
      data,
    });
    if (!updatedReview) throw new NotFoundError("Review");

    return updatedReview;
  }

  async delete({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<SelectReview> {
    const deletedReview = await this.repository.delete({ reviewId });
    if (!deletedReview) throw new NotFoundError("Review");

    return deletedReview;
  }

  async count(): Promise<number> {
    return await this.repository.count();
  }

  async countByUserId({ userId }: { userId: Types.ObjectId }): Promise<number> {
    return await this.repository.countByUserId({ userId });
  }

  async countByProductId({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<number> {
    return await this.repository.countByProductId({ productId });
  }

  async existsById({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<{ _id: Types.ObjectId }> {
    const exists = await this.repository.existsById({ reviewId });
    if (!exists) throw new NotFoundError("Review");

    return exists;
  }

  async existsByUserIdAndProductId({
    userId,
    productId,
  }: {
    userId: Types.ObjectId;
    productId: Types.ObjectId;
  }): Promise<{ _id: Types.ObjectId }> {
    const exists = await this.repository.existsByUserIdAndProductId({
      userId,
      productId,
    });
    if (!exists) throw new NotFoundError("Review");

    return exists;
  }
}
