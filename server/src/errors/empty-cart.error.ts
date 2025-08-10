import { ErrorType } from "../types/index.js";
import { BaseError } from "./base.error.js";

export class EmptyCartError extends BaseError {
	constructor(message: string = "No order items") {
		super(message, ErrorType.EMPTY_CART, 400);
	}
}
