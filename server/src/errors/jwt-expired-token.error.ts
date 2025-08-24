import { ErrorType } from "../types/index.js";
import { JwtBaseError } from "./jwt/jwt-base.error.js";

/** @deprecated - //TODO: remove */
export class JwtTokenExpiredError extends JwtBaseError {
	constructor(details?: Record<string, unknown>) {
		super("JWT token expired", ErrorType.AUTHENTICATION, 401, details);
	}
}
