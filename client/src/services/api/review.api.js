import { api } from "./base";

export function createReviewAPI({ data, token }) {
  return api.post("/reviews", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getReviewsByProductIdAPI({ productId }) {
  return api.get(`/reviews/product/${productId}`);
}
