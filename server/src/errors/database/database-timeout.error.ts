import { ErrorType } from "../../constants/index.js";
import { DatabaseBaseError } from "./database-base.error.js";

export class DatabaseTimeoutError extends DatabaseBaseError {
	constructor(
		message: string = "Database operation timed out",
		details?: Record<string, unknown>,
	) {
		super(message, ErrorType.DATABASE_ERROR, 504, details);
	}
}
