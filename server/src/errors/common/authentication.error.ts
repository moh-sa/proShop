import { ErrorType } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class AuthenticationError extends BaseError {
	constructor(message: string = "Authentication required") {
		super(message, ErrorType.AUTHENTICATION, 401);
	}
}
