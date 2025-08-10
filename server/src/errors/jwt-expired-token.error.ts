import { ErrorType } from "../types/index.js";
import { JwtBaseError } from "./base.error.js";

export class JwtTokenExpiredError extends JwtBaseError {
	constructor(details?: Record<string, unknown>) {
		super("JWT token expired", ErrorType.AUTHENTICATION, 401, details);
	}
}
