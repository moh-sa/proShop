import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { SessionBaseError } from "./session-base.error.js";

export class SessionValidationError extends SessionBaseError {
	constructor(details: Record<string, unknown>) {
		super(
			"Session validation error",
			ERROR_TYPE.VALIDATION,
			HTTP_STATUS.BAD_REQUEST,
			details,
		);
	}
}
