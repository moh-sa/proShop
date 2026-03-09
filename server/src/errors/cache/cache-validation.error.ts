import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { CacheBaseError } from "./cache-base.error.js";

export class CacheValidationError extends CacheBaseError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			`Cache validation failed: ${message}`,
			ERROR_TYPE.VALIDATION,
			HTTP_STATUS.BAD_REQUEST,
			details,
		);
	}

	static invalidKey(key: string) {
		return new CacheValidationError("Invalid cache key format", { key });
	}

	static invalidTTL(ttl: number) {
		return new CacheValidationError("Invalid TTL value", { ttl });
	}
}
