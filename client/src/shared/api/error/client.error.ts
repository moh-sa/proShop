import type { NormalizedError, ServerApiError } from "./normalize.error";

/**
 * Thrown by the API stack after `normalizeError()`. Narrow on `details.kind`.
 *
 * @example
 * if (error instanceof ClientApiError) {
 *   switch (error.details.kind) {
 *     // …
 *   }
 * }
 */
export class ClientApiError extends Error {
	readonly details: NormalizedError;

	constructor(details: NormalizedError) {
		super(extractMessage(details));
		this.name = "ClientApiError";
		this.details = details;
	}
}

/**
 * `Error.message`: for `SERVER`, use the first API detail message (no top-level `message` on that shape).
 */
function extractMessage(details: NormalizedError): string {
	if (isServerApiError(details)) {
		return details.details[0]?.message ?? "Server error";
	}
	return details.message;
}

function isServerApiError(details: NormalizedError): details is ServerApiError {
	return details.kind === "SERVER";
}
