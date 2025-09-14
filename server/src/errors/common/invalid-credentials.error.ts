import { ErrorType } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class InvalidCredentialsError extends BaseError {
	constructor(message: string, details: Record<string, unknown> = {}) {
		super(message, ErrorType.AUTHENTICATION, 401, details);
	}
}
