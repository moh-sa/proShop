import { SelectProduct } from "../../types";

export function findTopRatedProduct(
  products: Array<
    Omit<SelectProduct, "user" | "reviews"> & {
      user: unknown;
      reviews: unknown;
    }
  >,
) {
  return products.reduce((highest, product) => {
    return product.rating > highest.rating ? product : highest;
  });
}
