import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class ValidationError extends BaseError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(message, ERROR_TYPE.VALIDATION, HTTP_STATUS.BAD_REQUEST, details);
	}
}
