import { ErrorType } from "../../constants/index.js";
import { CacheBaseError } from "./cache-base.error.js";

export class CacheCapacityError extends CacheBaseError {
	constructor(
		message: string,
		details?: {
			batchSize?: number;
			currentSize?: number;
			maxSize?: number;
		},
	) {
		super(
			`Cache capacity exceeded: ${message}`,
			ErrorType.CACHE_CAPACITY_ERROR,
			500,
			details,
		);
	}

	static batchTooLarge(batchSize: number, maxSize: number) {
		return new CacheCapacityError(
			`Batch size (${batchSize}) exceeds maximum cache size (${maxSize})`,
			{ batchSize, maxSize },
		);
	}

	static memoryExhausted(currentSize: number, maxSize: number) {
		return new CacheCapacityError(
			`Cache memory exhausted: ${currentSize}/${maxSize} keys used`,
			{ currentSize, maxSize },
		);
	}
}
