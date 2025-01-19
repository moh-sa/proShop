import { SelectProduct, SelectUser } from "../types";

export function isReviewed(product: SelectProduct, user: SelectUser) {
  return (
    product.reviews.findIndex(
      (review) => review.user._id.toString() === user._id.toString(),
    ) > -1
  );
}
