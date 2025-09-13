import type { Response } from "express";

import type { HTTP_STATUS } from "../constants/index.js";

type ObjectType = Record<string, unknown>;

interface SuccessResponse<D = ObjectType, M = ObjectType> {
	data: D;
	meta?: M;
	success?: boolean;
}

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
