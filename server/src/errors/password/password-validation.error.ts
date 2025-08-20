import { ErrorType } from "../../types/index.js";
import { PasswordBaseError } from "./password-base.error.js";

export class PasswordValidationError extends PasswordBaseError {
	constructor(message: string, details: Record<string, unknown>) {
		super(message, ErrorType.PSW_VALIDATE, 500, details);
	}
}
