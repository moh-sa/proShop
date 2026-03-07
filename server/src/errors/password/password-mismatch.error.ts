import { ErrorType } from "../../constants/index.js";
import { PasswordBaseError } from "./password-base.error.js";

export class PasswordMismatchError extends PasswordBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super("Invalid password", ErrorType.AUTHENTICATION, 401, details);
	}
}
