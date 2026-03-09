import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class AuthenticationError extends BaseError {
	constructor(message: string = "Authentication required") {
		super(message, ERROR_TYPE.AUTHENTICATION, HTTP_STATUS.UNAUTHORIZED);
	}
}
