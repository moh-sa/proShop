import type { SuccessResponse } from "../types/index.js";

export function createSuccessResponseObject<D = unknown, M = unknown>(args: {
	data?: D;
	meta?: M;
}): SuccessResponse<{ data?: D; meta?: M }> {
	return {
		...args,
		success: true,
	};
}
