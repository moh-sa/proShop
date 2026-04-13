import type { ErrorType, HttpStatus } from "../types/index.js";

export class BaseError extends Error {
	constructor(
		public readonly message: string,
		public readonly type: ErrorType,
		public readonly statusCode: HttpStatus,
		public readonly details?: Record<string, unknown>,
	) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}
