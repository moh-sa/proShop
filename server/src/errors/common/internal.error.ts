import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class InternalError extends BaseError {
	constructor(
		message: string = "Internal server error",
		details?: Record<string, unknown>,
	) {
		super(
			message,
			ERROR_TYPE.INTERNAL,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			details,
		);
	}
}
