import type { ErrorType } from "../constants/index.js";

// Error response type
export interface ErrorDetails {
	[key: string]: unknown;
	message: string;
	path?: string;
}

export interface ErrorResponse {
	code: ErrorType;
	errors: Array<ErrorDetails>;
	success: false;
	timestamp: string;
}

// Strict Success Response Type
/**
 * Success response structure that conditionally includes `data` and/or `meta`
 * This enforces that at least one of `data` or `meta` must be provided
 */
export type StrictSuccessResponse<
	T extends { data?: unknown; meta?: unknown },
> = T extends {
	data: infer D;
	meta: infer M;
}
	? { data: D; meta: M; success: true } // both data and meta
	: T extends { data: infer D }
		? { data: D; success: true } // only data
		: T extends { meta: infer M }
			? { meta: M; success: true } // only meta
			: never; // neither data nor meta provided - compile error

// Strict Api Response Type
export type StrictApiResponse<T extends { data?: unknown; meta?: unknown }> =
	| ErrorResponse
	| StrictSuccessResponse<T>;
