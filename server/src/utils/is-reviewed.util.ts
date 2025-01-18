import { SelectUser, TSelectProduct } from "../types";

export function isReviewed(product: TSelectProduct, user: SelectUser) {
  return (
    product.reviews.findIndex(
      (review) => review.user._id.toString() === user._id.toString(),
    ) > -1
  );
}
