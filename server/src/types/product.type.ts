import { Types } from "mongoose";
import { TSelectReview } from "./review.type";
import { SelectUser } from "./user.type";

interface BaseProduct {
  name: string;
  image: string;
  brand: string;
  category: string;
  description: string;
  rating: number;
  numReviews: number;
  price: number;
  countInStock: number;
}

export interface TInsertProduct extends BaseProduct {
  user: Types.ObjectId;
  reviews: Array<Types.ObjectId>;
}

export interface TSelectProduct extends BaseProduct {
  _id: Types.ObjectId;
  user: SelectUser;
  reviews: Array<TSelectReview>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TProductSchema extends TSelectProduct {}
