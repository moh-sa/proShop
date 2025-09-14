import { ErrorType } from "../../constants/index.js";
import { PasswordBaseError } from "./password-base.error.js";

export class PasswordHashError extends PasswordBaseError {
	constructor(details: Record<string, unknown>) {
		const message = "Failed to hash password";
		super(message, ErrorType.PSW_HASH, 500, details);
	}
}
