import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { PasswordBaseError } from "./password-base.error.js";

export class PasswordMismatchError extends PasswordBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Invalid password",
			ERROR_TYPE.AUTHENTICATION,
			HTTP_STATUS.UNAUTHORIZED,
			details,
		);
	}
}
