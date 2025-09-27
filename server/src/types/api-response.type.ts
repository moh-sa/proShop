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

// Success response type
/** @deprecated will be removed in the future */
export interface SuccessResponse<
	D = Record<string, unknown>,
	M = Record<string, unknown>,
> {
	data: D;
	meta?: M;
	success?: boolean;
}

// Api response type
/** @deprecated will be removed in the future */
export type ApiResponse<
	D = Record<string, unknown>,
	M = Record<string, unknown>,
> = ErrorResponse | SuccessResponse<D, M>;
