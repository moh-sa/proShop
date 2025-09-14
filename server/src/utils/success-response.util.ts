import type { Response } from "express";

import type { HTTP_STATUS } from "../constants/index.js";
import type { SuccessResponse } from "../types/index.js";

export function createSuccessResponseObject<D, M = undefined>({
	data,
	meta,
}: {
	data: D;
	meta?: M;
}): SuccessResponse<D, M> {
	return {
		data,
		meta,
		success: true,
	};
}

export function sendSuccessResponse<D, M = undefined>({
	data,
	meta,
	responseContext,
	statusCode,
}: SuccessResponse<D, M> & {
	responseContext: Response;
	statusCode: HTTP_STATUS;
}): void {
	const response = createSuccessResponseObject({ data, meta });
	responseContext.status(statusCode).json(response);
}
