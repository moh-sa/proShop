import { Types } from "mongoose";
import { TSelectUser } from "./user.type";

interface BaseReview {
  name: string;
  rating: number;
  comment: string;
}

export interface TInsertReview extends BaseReview {
  user: Types.ObjectId;
}

export interface TSelectReview extends BaseReview {
  _id: Types.ObjectId;
  user: TSelectUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface TReviewSchema extends TSelectReview {}
