import type { Types } from "mongoose";

import type { IReviewRepository } from "../repositories/index.js";
import type { InsertReview, SelectReview } from "../types/index.js";

import { NotFoundError } from "../errors/index.js";
import { ReviewRepository } from "../repositories/index.js";

export interface IReviewService {
  count: () => Promise<number>;
  countByProductId: (data: { productId: Types.ObjectId }) => Promise<number>;
  countByUserId: (data: { userId: Types.ObjectId }) => Promise<number>;
  create: (data: InsertReview) => Promise<SelectReview>;
  delete: (data: { reviewId: Types.ObjectId }) => Promise<SelectReview>;
  existsById: (data: {
    reviewId: Types.ObjectId;
  }) => Promise<{ _id: Types.ObjectId }>;
  existsByUserIdAndProductId: (data: {
    productId: Types.ObjectId;
    userId: Types.ObjectId;
  }) => Promise<{ _id: Types.ObjectId }>;
  getAll: () => Promise<Array<SelectReview>>;
  getAllByProductId: (data: {
    productId: Types.ObjectId;
  }) => Promise<Array<SelectReview>>;
  getAllByUserId: (data: {
    userId: Types.ObjectId;
  }) => Promise<Array<SelectReview>>;
  getById: (data: { reviewId: Types.ObjectId }) => Promise<SelectReview>;
  update: (data: {
    data: Partial<InsertReview>;
    reviewId: Types.ObjectId;
  }) => Promise<SelectReview>;
}
export class ReviewService implements IReviewService {
  private readonly _repository: IReviewRepository;

  constructor(repository: IReviewRepository = new ReviewRepository()) {
    this._repository = repository;
  }

  async count(): Promise<number> {
    return await this._repository.count();
  }

  async countByProductId({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<number> {
    return await this._repository.countByProductId({ productId });
  }

  async countByUserId({ userId }: { userId: Types.ObjectId }): Promise<number> {
    return await this._repository.countByUserId({ userId });
  }

  async create(data: InsertReview): Promise<SelectReview> {
    return await this._repository.create(data);
  }

  async delete({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<SelectReview> {
    const deletedReview = await this._repository.delete({ reviewId });
    if (!deletedReview) throw new NotFoundError("Review");

    return deletedReview;
  }

  async existsById({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<{ _id: Types.ObjectId }> {
    const exists = await this._repository.existsById({ reviewId });
    if (!exists) throw new NotFoundError("Review");

    return exists;
  }

  async existsByUserIdAndProductId({
    productId,
    userId,
  }: {
    productId: Types.ObjectId;
    userId: Types.ObjectId;
  }): Promise<{ _id: Types.ObjectId }> {
    const exists = await this._repository.existsByUserIdAndProductId({
      productId,
      userId,
    });
    if (!exists) throw new NotFoundError("Review");

    return exists;
  }

  async getAll(): Promise<Array<SelectReview>> {
    return await this._repository.getAll();
  }

  async getAllByProductId({
    productId,
  }: {
    productId: Types.ObjectId;
  }): Promise<Array<SelectReview>> {
    return await this._repository.getAllByProductId({ productId });
  }

  async getAllByUserId({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<Array<SelectReview>> {
    return await this._repository.getAllByUserId({ userId });
  }

  async getById({
    reviewId,
  }: {
    reviewId: Types.ObjectId;
  }): Promise<SelectReview> {
    const review = await this._repository.getById({ reviewId });
    if (!review) throw new NotFoundError("Review");

    return review;
  }

  async update({
    data,
    reviewId,
  }: {
    data: Partial<InsertReview>;
    reviewId: Types.ObjectId;
  }): Promise<SelectReview> {
    const updatedReview = await this._repository.update({
      data,
      reviewId,
    });
    if (!updatedReview) throw new NotFoundError("Review");

    return updatedReview;
  }
}
