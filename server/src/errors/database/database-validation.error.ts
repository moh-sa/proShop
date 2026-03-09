import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { DatabaseBaseError } from "./database-base.error.js";

export class DatabaseValidationError extends DatabaseBaseError {
	constructor(
		message: string = "Database validation failed",
		details?: Record<string, unknown>,
	) {
		super(message, ERROR_TYPE.DATABASE_ERROR, HTTP_STATUS.BAD_REQUEST, details);
	}
}
