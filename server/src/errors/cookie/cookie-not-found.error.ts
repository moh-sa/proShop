import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { CookieBaseError } from "./cookie-base.error.js";

export class CookieNotFoundError extends CookieBaseError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			`Cookie not found: ${message}`,
			ERROR_TYPE.COOKIE_NOT_FOUND,
			HTTP_STATUS.NOT_FOUND,
			details,
		);
	}

	static byName(cookieName: string, cause?: unknown) {
		return new CookieNotFoundError(`Cookie '${cookieName}' not found`, {
			cause,
		});
	}
}
