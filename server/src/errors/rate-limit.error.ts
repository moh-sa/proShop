import { ERROR_TYPE, HTTP_STATUS } from "../constants/index.js";
import { BaseError } from "./base.error.js";

export class RateLimitError extends BaseError {
	constructor(message: string = "Too many requests") {
		super(message, ERROR_TYPE.RATE_LIMIT, HTTP_STATUS.TOO_MANY_REQUESTS);
	}
}
