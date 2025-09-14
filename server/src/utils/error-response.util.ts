import type { Response } from "express";

import type { HTTP_STATUS } from "../constants/index.js";
import type { ErrorResponse } from "../types/index.js";

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
	statusCode: HTTP_STATUS;
}): void {
	const response = createErrorResponseObject({ code, errors });
	responseContext.status(statusCode).json(response);
}
