import { ErrorType } from "../../types/index.js";
import { SessionBaseError } from "./session-base.error.js";

export class SessionNotFoundError extends SessionBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super("Session not found", ErrorType.NOT_FOUND, 404, details);
	}
}
