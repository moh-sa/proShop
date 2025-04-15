import { SelectProduct } from "../../types";

export function findTopRatedProduct(
  products: Array<
    Omit<SelectProduct, "user" | "image"> & {
      user: unknown;
    }
  >,
) {
  return products.reduce((highest, product) => {
    return product.rating > highest.rating ? product : highest;
  });
}
