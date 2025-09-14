import { ErrorType } from "../../constants/index.js";
import { SessionBaseError } from "./session-base.error.js";

export class SessionAlreadyExistsError extends SessionBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super("Session already exists", ErrorType.CONFLICT, 409, details);
	}
}
