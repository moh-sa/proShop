import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { JwtBaseError } from "./jwt-base.error.js";

export class JwtInvalidTokenError extends JwtBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Invalid JWT token format",
			ERROR_TYPE.JWT_INVALID_TOKEN,
			HTTP_STATUS.UNAUTHORIZED,
			details,
		);
	}
}
