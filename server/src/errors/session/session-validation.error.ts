import { ErrorType } from "../../constants/index.js";
import { SessionBaseError } from "./session-base.error.js";

export class SessionValidationError extends SessionBaseError {
	constructor(details: Record<string, unknown>) {
		super("Session validation error", ErrorType.VALIDATION, 400, details);
	}
}
