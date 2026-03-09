import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { JwtBaseError } from "./jwt-base.error.js";

export class JwtExpirationError extends JwtBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"JWT token has expired",
			ERROR_TYPE.JWT_EXPIRATION,
			HTTP_STATUS.UNAUTHORIZED,
			details,
		);
	}
}
