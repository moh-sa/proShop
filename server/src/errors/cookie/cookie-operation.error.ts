import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { CookieBaseError } from "./cookie-base.error.js";

export class CookieOperationError extends CookieBaseError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			`Cookie operation failed: ${message}`,
			ERROR_TYPE.COOKIE_OPERATION,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			details,
		);
	}

	static deleteFailed(cookieName: string, cause?: unknown) {
		return new CookieOperationError(`Failed to delete cookie '${cookieName}'`, {
			cause,
		});
	}

	static getFailed(cookieName: string, cause?: unknown) {
		return new CookieOperationError(
			`Failed to retrieve cookie '${cookieName}'`,
			{ cause },
		);
	}

	static setFailed(cookieName: string, cause?: unknown) {
		return new CookieOperationError(`Failed to set cookie '${cookieName}'`, {
			cause,
		});
	}
}
