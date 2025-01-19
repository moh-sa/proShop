import { SelectProduct } from "./product.type";

export interface TOrderItem extends SelectProduct {
  qty: number;
}
