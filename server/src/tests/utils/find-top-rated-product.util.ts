import { SelectProduct } from "../../types";

export function findTopRatedProduct(products: Array<SelectProduct>) {
  return products.reduce((highest, product) => {
    return product.rating > highest.rating ? product : highest;
  });
}
