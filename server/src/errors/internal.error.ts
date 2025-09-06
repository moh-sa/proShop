import { ErrorType } from "../types/index.js";
import { BaseError } from "./base.error.js";

export class InternalError extends BaseError {
	constructor(
		message: string = "Internal server error",
		details?: Record<string, unknown>,
	) {
		super(message, ErrorType.INTERNAL, 500, details);
	}
}
