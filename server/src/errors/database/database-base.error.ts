import { ErrorType } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class DatabaseBaseError extends BaseError {
	constructor(
		message: string,
		type: ErrorType = ErrorType.INTERNAL,
		statusCode: number = 500,
		details?: Record<string, unknown>,
	) {
		super(message, type, statusCode, details);
	}
}
