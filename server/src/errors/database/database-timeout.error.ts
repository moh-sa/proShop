import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { DatabaseBaseError } from "./database-base.error.js";

export class DatabaseTimeoutError extends DatabaseBaseError {
	constructor(
		message: string = "Database operation timed out",
		details?: Record<string, unknown>,
	) {
		super(
			message,
			ERROR_TYPE.DATABASE_ERROR,
			HTTP_STATUS.GATEWAY_TIMEOUT,
			details,
		);
	}
}
