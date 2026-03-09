import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class InvalidCredentialsError extends BaseError {
	constructor(message: string, details: Record<string, unknown> = {}) {
		super(
			message,
			ERROR_TYPE.AUTHENTICATION,
			HTTP_STATUS.UNAUTHORIZED,
			details,
		);
	}
}
