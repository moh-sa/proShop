import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { HttpStatus } from "../../types/index.js";
import { CacheBaseError } from "./cache-base.error.js";

export class CacheCapacityError extends CacheBaseError {
	constructor(
		message: string,
		statusCode: HttpStatus,
		details?: {
			batchSize?: number;
			currentSize?: number;
			maxSize?: number;
		},
	) {
		super(
			`Cache capacity exceeded: ${message}`,
			ERROR_TYPE.CACHE_CAPACITY_ERROR,
			statusCode,
			details,
		);
	}

	static batchTooLarge(batchSize: number, maxSize: number) {
		return new CacheCapacityError(
			`Batch size (${batchSize}) exceeds maximum cache size (${maxSize})`,
			HTTP_STATUS.CONTENT_TOO_LARGE,
			{ batchSize, maxSize },
		);
	}

	static memoryExhausted(currentSize: number, maxSize: number) {
		return new CacheCapacityError(
			`Cache memory exhausted: ${currentSize}/${maxSize} keys used`,
			HTTP_STATUS.SERVICE_UNAVAILABLE,
			{ currentSize, maxSize },
		);
	}
}
