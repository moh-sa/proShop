import { ErrorType } from "../../types/index.js";
import { CookieBaseError } from "./cookie-base.error.js";

export class CookieSerializationError extends CookieBaseError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			`Cookie serialization failed: ${message}`,
			ErrorType.COOKIE_SERIALIZATION,
			400,
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
