import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { CookieBaseError } from "./cookie-base.error.js";

export class CookieSerializationError extends CookieBaseError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			`Cookie serialization failed: ${message}`,
			ERROR_TYPE.COOKIE_SERIALIZATION,
			HTTP_STATUS.BAD_REQUEST,
			details,
		);
	}

	static parseFailed(value: string, cause?: unknown) {
		return new CookieSerializationError(
			"Failed to parse cookie value from JSON",
			{
				cause,
				value,
			},
		);
	}

	static stringifyFailed(value: unknown, cause?: unknown) {
		return new CookieSerializationError(
			"Failed to stringify cookie value to JSON",
			{
				cause,
				value,
			},
		);
	}
}
