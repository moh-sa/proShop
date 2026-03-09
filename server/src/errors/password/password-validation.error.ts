import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { PasswordBaseError } from "./password-base.error.js";

export class PasswordValidationError extends PasswordBaseError {
	constructor(message: string, details: Record<string, unknown>) {
		super(message, ERROR_TYPE.PSW_VALIDATE, HTTP_STATUS.BAD_REQUEST, details);
	}
}
