import { TSelectProduct, TSelectUser } from "../types";

export function isReviewed(product: TSelectProduct, user: TSelectUser) {
  return (
    product.reviews.findIndex((review) => review.user._id === user._id) > -1
  );
}
