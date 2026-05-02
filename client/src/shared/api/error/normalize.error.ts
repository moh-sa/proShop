import { isAxiosError } from "axios";
import { ZodError } from "zod";

import { errorResponseSchema } from "../schemas";
import type { ApiError, ApiErrorDetail } from "../types";
import { ERROR_KIND } from "./codes.error";

/**
 * No response received (timeout, DNS, offline, connection refused, etc.).
 */
export type NetworkError = {
	kind: typeof ERROR_KIND.NETWORK;
	message: string;
};

/**
 * Server returned a well-formed ErrorResponse body.
 */
export type ServerApiError = Omit<ApiError, "errors" | "success"> & {
	details: Array<ApiErrorDetail>;
	kind: typeof ERROR_KIND.SERVER;
	status: number;
};

/** Response body failed Zod validation. */
export type ResponseParseError = {
	issues: ZodError["issues"];
	kind: typeof ERROR_KIND.RESPONSE_PARSE;
	message: string;
};

/** Input failed Zod validation before the request was sent. */
export type InputValidationError = {
	issues: ZodError["issues"];
	kind: typeof ERROR_KIND.INPUT_VALIDATION;
	message: string;
};

/** Fallback when the error does not match the cases above. */
export type UnknownError = {
	kind: typeof ERROR_KIND.UNKNOWN;
	message: string;
};

/** Discriminated union for all API-layer errors; narrow on `kind`. */
export type NormalizedError =
	| InputValidationError
	| NetworkError
	| ResponseParseError
	| ServerApiError
	| UnknownError;

/**
 * Converts any thrown value into a `NormalizedError`.
 *
 * @param error - Caught value.
 * @param zodSource - For `ZodError` only: pass `"response"` when validating the HTTP-response body,
 *   `"input"` when validating arguments before sending the request. Defaults to `"input"`.
 *
 * @example
 * throw new ClientApiError(
 *   normalizeError(parsed.error, "response")
 * );
 *
 * throw new ClientApiError(
 *   normalizeError(e)
 * );

 */
export function normalizeError(
	error: unknown,
	zodSource: "input" | "response" = "input",
): NormalizedError {
	if (error instanceof ZodError) {
		const path = error.issues[0]?.path.join(".");
		const message = error.issues[0]?.message ?? "Validation failed";
		const firstMessage = path ? `${path}: ${message}` : message;

		if (zodSource === "response") {
			return {
				issues: error.issues,
				kind: ERROR_KIND.RESPONSE_PARSE,
				message: firstMessage,
			};
		}

		return {
			issues: error.issues,
			kind: ERROR_KIND.INPUT_VALIDATION,
			message: firstMessage,
		};
	}

	// Axios type guard — narrows to AxiosError / error.response.
	if (isAxiosError(error)) {
		if (!error.response) {
			return {
				kind: ERROR_KIND.NETWORK,
				message: error.message,
			};
		}

		const parsed = errorResponseSchema.safeParse(error.response.data);

		if (parsed.success) {
			return {
				details: parsed.data.errors,
				code: parsed.data.code,
				kind: ERROR_KIND.SERVER,
				status: error.response.status,
				timestamp: parsed.data.timestamp,
			};
		}

		// Fallback when the error response body is not the expected shape.
		return {
			kind: ERROR_KIND.UNKNOWN,
			message: `Unexpected server response (HTTP ${error.response.status})`,
		};
	}

	const message =
		error instanceof Error ? error.message : "An unknown error occurred";

	return { kind: ERROR_KIND.UNKNOWN, message };
}
