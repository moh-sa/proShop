import type { ErrorType } from "./error-type.type.js";

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

// Success Response Type
/**
 * Success response structure that conditionally includes `data` and/or `meta`
 * This enforces that at least one of `data` or `meta` must be provided
 */
export type SuccessResponse<T extends { data?: unknown; meta?: unknown }> =
	T extends {
		data: infer D;
		meta: infer M;
	}
		? { data: D; meta: M; success: true } // both data and meta
		: T extends { data: infer D }
			? { data: D; success: true } // only data
			: T extends { meta: infer M }
				? { meta: M; success: true } // only meta
				: { success: true }; // neither data nor meta provided

// Api Response Type
export type ApiResponse<T extends { data?: unknown; meta?: unknown }> =
	| ErrorResponse
	| SuccessResponse<T>;
