import { ErrorType } from "../../constants/index.js";
import { CookieBaseError } from "./cookie-base.error.js";

export class CookieNotFoundError extends CookieBaseError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			`Cookie not found: ${message}`,
			ErrorType.COOKIE_NOT_FOUND,
			404,
			details,
		);
	}

	static byName(cookieName: string, cause?: unknown) {
		return new CookieNotFoundError(`Cookie '${cookieName}' not found`, {
			cause,
		});
	}
}
