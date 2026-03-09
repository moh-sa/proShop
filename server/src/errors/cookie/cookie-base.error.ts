import { ERROR_TYPE } from "../../constants/index.js";
import { ErrorType, HttpStatus } from "../../types/index.js";
import { BaseError } from "../base.error.js";

export class CookieBaseError extends BaseError {
	constructor(
		message: string,
		type: ErrorType = ERROR_TYPE.INTERNAL,
		statusCode: HttpStatus = 500,
		details?: Record<string, unknown>,
	) {
		super(message, type, statusCode, details);
	}
}
