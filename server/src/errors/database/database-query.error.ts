import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { DatabaseBaseError } from "./database-base.error.js";

export class DatabaseQueryError extends DatabaseBaseError {
	constructor(
		message: string = "Database query failed",
		details?: Record<string, unknown>,
	) {
		super(
			message,
			ERROR_TYPE.DATABASE_ERROR,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			details,
		);
	}
}
