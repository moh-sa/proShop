import { ErrorType } from "../../constants/index.js";
import { JwtBaseError } from "./jwt-base.error.js";

export class JwtExpirationError extends JwtBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super("JWT token has expired", ErrorType.JWT_EXPIRATION, 401, details);
	}
}
