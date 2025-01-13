import { TSelectProduct, TSelectUser } from "../types";

export function isReviewed(product: TSelectProduct, user: TSelectUser) {
  return (
    product.reviews.findIndex(
      (review) => review.user._id.toString() === user._id.toString(),
    ) > -1
  );
}
