import { TSelectProduct } from "./product.type";

export interface TOrderItem extends TSelectProduct {
  qty: number;
}
