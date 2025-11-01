import { ErrorType } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class ForbiddenError extends BaseError {
	constructor(
		message: string = "You are not allowed to access this resource",
		details?: Record<string, unknown>,
	) {
		super(message, ErrorType.FORBIDDEN, 403, details);
	}
}
