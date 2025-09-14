import { ErrorType } from "../../constants/index.js";
import { CookieBaseError } from "./cookie-base.error.js";

export class CookieValidationError extends CookieBaseError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			`Cookie validation failed: ${message}`,
			ErrorType.COOKIE_VALIDATION,
			400,
			details,
		);
	}

	static emptyName() {
		return new CookieValidationError("Cookie name cannot be empty");
	}

	static emptyValue() {
		return new CookieValidationError("Cookie value cannot be empty");
	}

	static invalidName(name: string) {
		return new CookieValidationError("Cookie name must be a string", { name });
	}

	static invalidRequest() {
		return new CookieValidationError(
			"Request is not a valid Express Request object",
		);
	}

	static invalidResponse() {
		return new CookieValidationError(
			"Response is not a valid Express Response object",
		);
	}

	static invalidValue(value: unknown) {
		return new CookieValidationError("Cookie value must be a string", {
			value,
		});
	}

	static schemaValidationFailed(cookieName: string, cause?: unknown) {
		return new CookieValidationError(
			`Cookie '${cookieName}' data doesn't match expected schema`,
			{
				cause,
				cookieName,
			},
		);
	}
}
