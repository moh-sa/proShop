import { ErrorType } from "../../constants/index.js";
import { DatabaseBaseError } from "./database-base.error.js";

export class DatabaseNetworkError extends DatabaseBaseError {
	constructor(
		message: string = "Database connection failed",
		details?: Record<string, unknown>,
	) {
		super(message, ErrorType.DATABASE_ERROR, 503, details);
	}
}
