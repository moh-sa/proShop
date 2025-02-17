import { SelectProduct } from "../../types";

export function findTopRatedProduct(
  products: Array<
    Omit<SelectProduct, "user"> & {
      user: unknown;
    }
  >,
) {
  return products.reduce((highest, product) => {
    return product.rating > highest.rating ? product : highest;
  });
}
