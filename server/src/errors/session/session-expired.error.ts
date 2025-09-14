import { ErrorType } from "../../constants/index.js";
import { SessionBaseError } from "./session-base.error.js";

export class SessionExpiredError extends SessionBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super("Session expired", ErrorType.AUTHENTICATION, 401, details);
	}
}
