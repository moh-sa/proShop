import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class ForbiddenError extends BaseError {
	constructor(
		message: string = "You are not allowed to access this resource",
		details?: Record<string, unknown>,
	) {
		super(message, ERROR_TYPE.FORBIDDEN, HTTP_STATUS.FORBIDDEN, details);
	}
}
