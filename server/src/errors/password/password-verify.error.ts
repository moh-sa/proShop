import { ErrorType } from "../../types/index.js";
import { PasswordBaseError } from "./password-base.error.js";

export class PasswordVerifyError extends PasswordBaseError {
	constructor(details: Record<string, unknown>) {
		const message = "Failed to verify password";
		super(message, ErrorType.PSW_VERIFY, 500, details);
	}
}
