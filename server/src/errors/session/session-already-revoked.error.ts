import { ErrorType } from "../../constants/index.js";
import { SessionBaseError } from "./session-base.error.js";

export class SessionAlreadyRevokedError extends SessionBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super("Session is already revoked", ErrorType.AUTHENTICATION, 401, details);
	}
}
