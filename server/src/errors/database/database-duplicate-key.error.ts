import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { DatabaseBaseError } from "./database-base.error.js";

export class DatabaseDuplicateKeyError extends DatabaseBaseError {
	constructor(
		message: string = "Database duplicate key error",
		details?: Record<string, unknown>,
	) {
		super(message, ERROR_TYPE.DATABASE_ERROR, HTTP_STATUS.CONFLICT, details);
	}
}
