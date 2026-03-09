import type { Response } from "express";

import type { HttpStatus, SuccessResponse } from "../types/index.js";

export function createSuccessResponseObject<D = unknown, M = unknown>(args: {
	data?: D;
	meta?: M;
}): SuccessResponse<{ data?: D; meta?: M }> {
	return {
		...args,
		success: true,
	};
}

export function sendSuccessResponse<D, M = undefined>({
	data,
	meta,
	responseContext,
	statusCode,
}: SuccessResponse<{ data: D; meta: M }> & {
	responseContext: Response;
	statusCode: HttpStatus;
}): void {
	const response = createSuccessResponseObject({ data, meta });
	responseContext.status(statusCode).json(response);
}
