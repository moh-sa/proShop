import { ErrorType } from "../types/index.js";
import { BaseError } from "./base.error.js";

export class RateLimitError extends BaseError {
	constructor(message: string = "Too many requests") {
		super(message, ErrorType.RATE_LIMIT, 429);
	}
}
