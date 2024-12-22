import { api } from "./base";

export function addToCartAPI(productId, qty) {
  return api.get(`/products/${productId}`);
}
