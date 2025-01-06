import { Types } from "mongoose";
import { TPaymentResult } from "./payment-result.type";
import { TShippingAddress } from "./shipping-address.type";
import { TSelectUser } from "./user.type";

interface BaseOrder {
  orderItems: Array<Types.ObjectId>;
  shippingAddress: TShippingAddress;
  paymentMethod: string;
  paymentResult: TPaymentResult;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt: Date; // TODO: create a "pre save" to automatically update the date. Ensure that the flag is true AND this field doesn't have a value before updating
  isDelivered: boolean;
  deliveredAt: Date; // TODO: create a "pre save" to automatically update the date. Ensure that the flag is true AND this field doesn't have a value before updating
}

export interface TInsertOrder extends BaseOrder {
  user: Types.ObjectId;
}

export interface TSelectOrder extends BaseOrder {
  _id: Types.ObjectId;
  user: TSelectUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface TOrderSchema extends TSelectOrder {}
