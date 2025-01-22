import { ErrorType } from "../types";
import { BaseError } from "./base.error";

export class EmptyCartError extends BaseError {
  constructor(message: string = "No order items") {
    super(message, ErrorType.EMPTY_CART, 400);
  }
}
