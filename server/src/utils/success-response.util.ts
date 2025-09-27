import type { Response } from "express";

import type { HTTP_STATUS } from "../constants/index.js";
import type { StrictSuccessResponse } from "../types/index.js";

export function createStrictSuccessResponseObject<D, M>(
	data: D,
	meta?: M,
): StrictSuccessResponse<{ data: D }>;
export function createStrictSuccessResponseObject<D, M>(
	data: D,
	meta: M,
): StrictSuccessResponse<{ data: D; meta: M }>;
export function createStrictSuccessResponseObject<D, M>(data: D, meta: M) {
	if (data && meta) {
		return { data, meta, success: true };
	}
	if (data) {
		return { data, success: true };
	}

	if (meta) {
		return { meta, success: true };
	}
}

export function sendStrictSuccessResponse<D, M = undefined>({
	data,
	meta,
	responseContext,
	statusCode,
}: StrictSuccessResponse<{ data: D; meta: M }> & {
	responseContext: Response;
	statusCode: HTTP_STATUS;
}): void {
	const response = createStrictSuccessResponseObject({ data, meta });
	responseContext.status(statusCode).json(response);
}
