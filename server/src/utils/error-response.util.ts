import type { Response } from "express";

import type { ErrorResponse, HttpStatus } from "../types/index.js";

export function createErrorResponseObject({
	code,
	errors,
}: Omit<ErrorResponse, "success" | "timestamp">): ErrorResponse {
	return {
		code,
		errors,
		success: false,
		timestamp: new Date().toISOString(),
	};
}

export function sendErrorResponse({
	code,
	errors,
	responseContext,
	statusCode,
}: Omit<ErrorResponse, "success" | "timestamp"> & {
	responseContext: Response;
	statusCode: HttpStatus;
}): void {
	const response = createErrorResponseObject({ code, errors });
	responseContext.status(statusCode).json(response);
}
