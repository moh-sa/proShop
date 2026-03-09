import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { SessionBaseError } from "./session-base.error.js";

export class SessionAlreadyExistsError extends SessionBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Session already exists",
			ERROR_TYPE.CONFLICT,
			HTTP_STATUS.CONFLICT,
			details,
		);
	}
}
