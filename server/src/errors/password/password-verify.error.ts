import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { PasswordBaseError } from "./password-base.error.js";

export class PasswordVerifyError extends PasswordBaseError {
	constructor(details: Record<string, unknown>) {
		const message = "Failed to verify password";
		super(
			message,
			ERROR_TYPE.PSW_VERIFY,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			details,
		);
	}
}
