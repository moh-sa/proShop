import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { SessionBaseError } from "./session-base.error.js";

export class SessionAlreadyRevokedError extends SessionBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Session is already revoked",
			ERROR_TYPE.AUTHENTICATION,
			HTTP_STATUS.UNAUTHORIZED,
			details,
		);
	}
}
