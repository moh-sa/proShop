import { Request } from "express";
import { IProduct } from "../models/productModel";
import { IUser } from "../models/userModel";

export function isReviewed(
  product: IProduct,
  reqWithUser: Request & { user: IUser },
) {
  return (
    product.reviews.findIndex(
      (review) => review.user._id === reqWithUser.user._id,
    ) > -1
  );
}
