import { Types } from "mongoose";
import { SelectUser } from "./user.type";

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
  user: SelectUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface TReviewSchema extends TSelectReview {}
