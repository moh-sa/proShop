import { ErrorType } from "../types/index.js";
import { JwtBaseError } from "./jwt/jwt-base.error.js";

/** @deprecated - //TODO: remove */
export class InvalidJwtTokenError extends JwtBaseError {
	constructor(details?: Record<string, unknown>) {
		super("Invalid JWT token format", ErrorType.AUTHENTICATION, 401, details);
	}
}
