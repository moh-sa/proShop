import { ErrorType } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class ValidationError extends BaseError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(message, ErrorType.VALIDATION, 400, details);
	}
}
