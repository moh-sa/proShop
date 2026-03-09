import { ERROR_TYPE, HTTP_STATUS } from "../constants/index.js";
import { BaseError } from "./base.error.js";

export class EmptyCartError extends BaseError {
	constructor(message: string = "No order items") {
		super(message, ERROR_TYPE.EMPTY_CART, HTTP_STATUS.BAD_REQUEST);
	}
}
