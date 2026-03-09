import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { SessionBaseError } from "./session-base.error.js";

export class SessionNotFoundError extends SessionBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Session not found",
			ERROR_TYPE.NOT_FOUND,
			HTTP_STATUS.NOT_FOUND,
			details,
		);
	}
}
