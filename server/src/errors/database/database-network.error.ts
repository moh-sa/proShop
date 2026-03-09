import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { DatabaseBaseError } from "./database-base.error.js";

export class DatabaseNetworkError extends DatabaseBaseError {
	constructor(
		message: string = "Database connection failed",
		details?: Record<string, unknown>,
	) {
		super(
			message,
			ERROR_TYPE.DATABASE_ERROR,
			HTTP_STATUS.SERVICE_UNAVAILABLE,
			details,
		);
	}
}
